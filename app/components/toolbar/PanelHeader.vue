<template>
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-base font-semibold text-slate-800 dark:text-slate-100">
      {{ title }}
    </h2>
    <button
      aria-label="Schließen"
      class="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
      @click="emit('close')"
    >
      <UIcon name="i-lucide-x" class="size-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();
</script>
