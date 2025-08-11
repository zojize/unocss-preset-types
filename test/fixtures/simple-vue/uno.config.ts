import { defineConfig, presetMini } from 'unocss'
import presetTypes from '../../..'

export default defineConfig({
  presets: [
    presetMini({ preflight: false }),
    presetTypes(),
  ]
})