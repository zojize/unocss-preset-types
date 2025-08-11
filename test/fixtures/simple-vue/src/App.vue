<script setup lang="ts">
import { useSizeAndColor } from './useSizeAndColor';

const { size, color } = useSizeAndColor()
</script>

<template>
  <div :class="`size-${size} bg-${color}`" />
</template>
