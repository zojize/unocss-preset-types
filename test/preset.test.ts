import { createGenerator } from '@unocss/core'
import { describe, expect, it } from 'vitest'
import presetTypes from '../src/preset'

describe('extractor', () => {
  it('should extract types from ts file', async () => {
    const uno = await createGenerator({
      presets: [
        presetTypes(),
      ],
      extractorDefault: false,
    })

    const result = await uno.applyExtractors(`
      const size = 1 as 1 | 2 | 3
      const color = 'red' as 'red' | 'blue'
      export const class_ = \`size-\${size} bg-\${color}\` as const
      `, 'test.ts')
    expect(result).toMatchInlineSnapshot(`
      Set {
        "red",
        "blue",
        "size-1",
        "bg-red",
        "bg-blue",
        "size-2",
        "size-3",
      }
    `)
  })

  it('should extract types from vue file', async () => {
    const uno = await createGenerator({
      presets: [
        presetTypes(),
      ],
      extractorDefault: false,
    })

    const result = await uno.applyExtractors(`
      <script setup lang="ts">
      import { ref } from 'vue'
      const size = ref<1 | 2 | 3>(1)
      const color = ref<'red' | 'blue'>('red')
      </script>
      <template>
        <div :class="\`size-\${size} bg-\${color}\`" />
      </template>
      `, 'test.vue')
    expect(result).toMatchInlineSnapshot(`
      Set {
        "test.vue",
        "red",
        "div",
        "size-1",
        "bg-red",
        "bg-blue",
        "size-2",
        "size-3",
        "blue",
      }
    `)
  })
})
