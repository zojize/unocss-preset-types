<br>

<p align="center">
<img src="https://raw.githubusercontent.com/zojize/unocss-extractor-types/main/icon.svg" style="width:100px;" />
</p>

# unocss-preset-types

This preset implements an extractor for TypeScript types, allowing TypeScript literal types to be used as utility classes in UnoCSS.

## Usage

```bash
pnpm i -D unocss-preset-types
```

```ts
// uno.config.ts
import { defineConfig } from 'unocss'
import presetTypes from 'unocss-preset-types'

export default defineConfig({
  presets: [
    presetTypes(),
  ],
})
```

## Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
const size = ref<1 | 2 | 3>(1)
const color = ref<'red' | 'blue'>('red')
</script>

<template>
  <div :class="`size-${size} bg-${color}`" />
</template>
```

```css
/* expected output */
.size-1  { /* ... */ }
.size-2  { /* ... */ }
.size-3  { /* ... */ }
.bg-blue { /* ... */ }
.bg-red  { /* ... */ }
```

See [/test](/test) for more examples.

## Caveats

- Only works with `.ts` and `.vue` files right now
- Does not support auto imports and global types (yet)
- Parsing and extracting types can be slow
- Does not work with dynamic template literals such as `` `size-${number}` ``, you can only nest union types like `` `size-${1 | 2 | 3}` ``
