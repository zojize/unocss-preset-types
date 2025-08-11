import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  externals: [
    'typescript',
    '@vue/compiler-sfc',
    '@unocss/core',
  ],
  declaration: true,
  clean: true,
})
