import { ref } from 'vue'

export function useSizeAndColor() {
  return {
    size: ref<1 | 2 | 3>(1),
    color: ref<'red' | 'blue'>('red'),
  }
}
