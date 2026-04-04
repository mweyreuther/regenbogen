<template>
  <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
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
      color="error"
      icon="i-lucide-trash-2"
      size="xs"
      @click="$emit('clear')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isEraser: boolean;
}>();

defineEmits<{
  "toggle-eraser": [];
  undo: [];
  clear: [];
}>();
</script>
