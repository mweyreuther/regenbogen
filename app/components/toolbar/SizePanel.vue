<template>
  <UDrawer
    :open="open"
    title="Größe"
    description="Pinselgröße wählen"
    @update:open="(v) => emit('update:open', v)"
  >
    <template #content>
      <div class="px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2">
        <ToolbarPanelHeader title="Größe" @close="emit('update:open', false)" />

        <div class="grid grid-cols-4 gap-3 py-4">
          <button
            v-for="size in brushSizes"
            :key="size.value"
            class="flex flex-col items-center gap-2"
            @click="setSize(size.value)"
          >
            <span
              class="flex aspect-square w-full items-center justify-center rounded-2xl border-2 transition-colors"
              :class="
                selectedSize === size.value
                  ? 'border-slate-800 bg-slate-100 dark:border-white dark:bg-slate-700'
                  : 'border-slate-200 dark:border-slate-600'
              "
            >
              <span
                class="rounded-full bg-slate-700 dark:bg-slate-200"
                :style="dotStyle(size.value)"
              />
            </span>
            <span
              class="text-sm font-semibold"
              :class="
                selectedSize === size.value
                  ? 'text-slate-800 dark:text-white'
                  : 'text-slate-500 dark:text-slate-300'
              "
            >
              {{ size.label }}
            </span>
          </button>
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { brushSizes, injectToolbar } from "~/composables/useToolbar";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [boolean] }>();

const { selectedSize, setSize } = injectToolbar();

function dotStyle(value: number) {
  const diameter = Math.min(6 + value * 0.26, 58);
  return { width: `${diameter}px`, height: `${diameter}px` };
}
</script>
