<template>
  <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
    <button
      class="flex size-6 items-center justify-center rounded-full border-2 transition-transform sm:size-7"
      :class="
        isNeon
          ? 'border-slate-700 bg-slate-900 dark:border-white'
          : 'border-slate-300 bg-slate-100 dark:border-slate-500 dark:bg-slate-700'
      "
      @click="$emit('toggle-neon')"
    >
      <UIcon
        name="i-lucide-zap"
        class="size-3.5 sm:size-4"
        :class="isNeon ? 'text-yellow-300' : 'text-slate-400 dark:text-slate-400'"
      />
    </button>
    <button
      v-for="color in colors"
      :key="color"
      class="size-6 rounded-full border-2 transition-all sm:size-7"
      :class="
        selectedColor === color && !isEraser
          ? 'scale-110 border-slate-700 dark:border-white'
          : 'border-slate-300 dark:border-slate-500'
      "
      :style="{
        backgroundColor: color,
        boxShadow: isNeon ? `0 0 8px 2px ${color}` : 'none',
      }"
      @click="$emit('select', color, $event)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  colors: string[];
  selectedColor: string;
  isNeon: boolean;
  isEraser: boolean;
}>();

defineEmits<{
  select: [color: string, event: MouseEvent];
  "toggle-neon": [];
}>();
</script>
