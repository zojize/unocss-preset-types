import type { Extractor, Preset } from '@unocss/core'
import path from 'node:path'
import process from 'node:process'
import * as sfcCompiler from '@vue/compiler-sfc'
import ts from 'typescript'

// TODO: somehow get auto-import types to work

let program: ts.Program | undefined
let host: ts.CompilerHost | undefined

const virtualFiles: Record<string, string> = {}
// https://github.com/unocss/unocss/blob/e297e4237c85bfc6b69c85eb5840c34953fff2e5/packages-engine/core/src/extractors/split.ts#L3
const defaultSplitRE = /[\\:]?[\s'"`;{}]+/g

export interface PresetTypesOptions {
  /**
   * Customize the splitting behavior of the extractor
   *
   * @default /[\\:]?[\s'"`;{}]+/g
   */
  split?: RegExp | string | boolean | ((input: string) => Iterable<string>)

  /**
   * Suppress errors during extraction
   *
   * @default true
   */
  silent?: boolean

  /**
   * The working directory for the preset
   *
   * @default process.cwd()
   */
  cwd?: string
}

export default function presetTypes(
  {
    silent = true,
    split = defaultSplitRE,
    cwd = process.cwd(),
  }: PresetTypesOptions = {
    silent: true,
    split: defaultSplitRE,
    cwd: process.cwd(),
  },
): Preset {
  let splitFn: ((input: string) => string[])
  if (split === true)
    splitFn = input => input.split(defaultSplitRE)
  else if (typeof split === 'string' || split instanceof RegExp)
    splitFn = input => input.split(split)
  else if (typeof split === 'function')
    splitFn = input => Array.from(split(input))
  else
    splitFn = input => [input]

  return {
    name: 'preset-types',
    extractors: [
      {
        name: 'extractor-types',
        extract: (ctx) => {
          try {
            return extractorFn(ctx)
          }
          catch (e) {
            if (!silent) {
              throw new Error(`preset-types: Failed to extract types from ${ctx.id}`, { cause: e })
            }
          }
        },
      },
    ],
    postprocess: () => {
      program = undefined
      host = undefined
    },
  }

  function extractorFn(...[{ id, extracted, code }]: Parameters<NonNullable<Extractor['extract']>>): ReturnType<NonNullable<Extractor['extract']>> {
    if (!id)
      return

    const isVue = /\.vue$/.test(id)
    if (!isVue && !/\.tsx?$/.test(id)) {
      console.warn(`preset-types: file ${id} is not a .vue or .ts/.tsx file, skipping.`)
      return
    }

    // TODO: avoid filename collision for vue files
    const filename = isVue ? `${id}.ts` : id
    if (isVue) {
      const { descriptor } = sfcCompiler.parse(code, {
        sourceMap: false,
        filename,
      })
      const script = sfcCompiler.compileScript(descriptor, {
        id: Math.random().toString(36).slice(2, 8),
        inlineTemplate: true,
        sourceMap: false,
        // TODO: support global types
        // globalTypeFiles: []
      })
      // force constant type to be evaluated for classes
      virtualFiles[filename] = `${script.content}
  declare module 'vue' {
    export function normalizeClass<const T>(value: T): string
  }`
    }

    if (!program) {
      const tsconfigPath = ts.findConfigFile(
        cwd,
        ts.sys.fileExists,
        'tsconfig.json',
      )

      if (!tsconfigPath) {
        console.warn(`preset-types: Could not find a 'tsconfig.json' in ${import.meta.dirname}`)
        return
      }

      const tsconfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
      const parsedConfig = ts.parseJsonConfigFileContent(
        tsconfigFile.config,
        ts.sys,
        path.dirname(tsconfigPath),
      )

      host = ts.createCompilerHost(parsedConfig.options)
      const origGetSourceFile = host.getSourceFile
      host.getSourceFile = (name, lang, ...args) => {
        if (name in virtualFiles) {
          return ts.createSourceFile(name, virtualFiles[name], lang, true)
        }
        return origGetSourceFile.call(host, name, lang, ...args)
      }
      // TODO: may need to override host.resolveModuleNameLiterals to handle exported types from vue files

      program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options, host)
    }

    let sourceFile = program.getSourceFile(filename)
    if (!sourceFile) {
      if (!isVue) {
        virtualFiles[filename] = code
      }
      program = ts.createProgram({
        rootNames: [...program.getRootFileNames(), filename],
        options: program.getCompilerOptions(),
        host: host!,
        oldProgram: program,
      })
      sourceFile = program.getSourceFile(filename)
    }

    if (!sourceFile) {
      console.warn(`preset-types: Source file ${filename} could not be created.`)
      return
    }

    const checker = program.getTypeChecker()

    ts.forEachChild(sourceFile, visit)

    function visit(node: ts.Node): void {
      const type = checker.getTypeAtLocation(node)
      if (ts.isExpression(node) && checker.isTypeAssignableTo(type, checker.getStringType())) {
        // TODO: filter only normalizeClass calls for vue?
        extractFromTypeNode(type)
      }

      ts.forEachChild(node, visit)
    }

    function extractFromTypeNode(type: ts.Type): void {
      if (type.isStringLiteral()) {
        splitFn(type.value).forEach(v => v.length > 0 && extracted.add(v))
      }
      else if (type.isUnionOrIntersection()) {
        type.types.forEach(extractFromTypeNode)
      }
    }
  }
}
