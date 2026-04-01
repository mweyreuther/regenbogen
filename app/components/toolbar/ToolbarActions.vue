<template>
  <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
    <UButton
      :variant="isRainbow ? 'solid' : 'ghost'"
      :color="isRainbow ? 'primary' : 'neutral'"
      icon="i-lucide-rainbow"
      size="xs"
      @click="$emit('toggle-rainbow')"
    />
    <UButton
      :variant="isBlink ? 'solid' : 'ghost'"
      :color="isBlink ? 'primary' : 'neutral'"
      icon="i-lucide-sparkles"
      size="xs"
      @click="$emit('toggle-blink')"
    />

    <div class="mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600" />

    <UButton
      :variant="isEraser ? 'solid' : 'ghost'"
      :color="isEraser ? 'primary' : 'neutral'"
      icon="i-lucide-eraser"
      size="xs"
      @click="$emit('toggle-eraser')"
    />
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-lucide-undo-2"
      size="xs"
      @click="$emit('undo')"
    />
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-lucide-trash-2"
      size="xs"
      @click="$emit('clear')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRainbow: boolean;
  isBlink: boolean;
  isEraser: boolean;
}>();

defineEmits<{
  "toggle-rainbow": [];
  "toggle-blink": [];
  "toggle-eraser": [];
  undo: [];
  clear: [];
}>();
</script>
