// yoinked some code from unocss/test/fixtures.test.ts

import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'

function getGlobContent(cwd: string, pattern: string) {
  return fs.globSync(pattern, { cwd })
    .map(file => fs.readFileSync(path.join(cwd, file), 'utf-8'))
    .join('\n')
}

describe.concurrent('fixtures', () => {
  it('simple vue', async () => {
    const root = path.resolve(__dirname, 'fixtures/simple-vue')
    fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true })
    await build({
      root,
      logLevel: 'warn',
      build: {
        sourcemap: true,
      },
    })

    const classSelectors = getGlobContent(root, 'dist/**/*.css')
      .matchAll(/\.([a-z0-9-]+)\{/g)
      .map(m => m[1])
      .toArray()
    expect(classSelectors).toMatchInlineSnapshot(`
      [
        "size-1",
        "size-2",
        "size-3",
        "bg-blue",
        "bg-red",
      ]
    `)
  })
})
