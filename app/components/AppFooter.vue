<template>
  <footer
    class="flex h-16 shrink-0 items-center justify-center border-t border-slate-200/80 bg-white/80 px-5 backdrop-blur-md mobile-landscape:h-auto mobile-landscape:w-16 mobile-landscape:flex-col mobile-landscape:border-t-0 mobile-landscape:border-l mobile-landscape:px-0 mobile-landscape:py-5 dark:border-slate-700/80 dark:bg-slate-800/80"
  >
    <ToolbarColorPicker
      :colors="colors"
      :selected-color="selectedColor"
      :is-neon="isNeon"
      :is-eraser="isEraser"
      @select="$emit('select', $event)"
      @custom="$emit('custom', $event)"
      @toggle-neon="$emit('toggle-neon')"
    />
  </footer>
</template>

<script setup lang="ts">
defineProps<{
  colors: string[];
  selectedColor: string;
  isNeon: boolean;
  isEraser: boolean;
}>();

defineEmits<{
  select: [color: string, event?: MouseEvent];
  custom: [color: string];
  "toggle-neon": [];
}>();
</script>
