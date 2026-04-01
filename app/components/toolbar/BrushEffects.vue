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
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRainbow: boolean;
  isBlink: boolean;
}>();

defineEmits<{
  "toggle-rainbow": [];
  "toggle-blink": [];
}>();
</script>
