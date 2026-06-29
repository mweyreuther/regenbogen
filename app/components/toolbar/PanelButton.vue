<template>
  <button
    class="flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors"
    :class="buttonClass"
    @click="emit('click')"
  >
    <UIcon :name="icon" class="size-6" />
    <span class="text-center leading-tight">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string;
  label: string;
  active?: boolean;
  danger?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();

const buttonClass = computed(() => {
  if (props.danger) {
    return "border-red-200 bg-red-50 text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400";
  }
  if (props.active) {
    return "border-sky-300 bg-sky-50 text-sky-600 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-400";
  }
  return "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700";
});
</script>
