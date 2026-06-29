<template>
  <!-- Always-visible quick undo / redo -->
  <div
    v-if="!isUiHidden"
    class="absolute left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 flex gap-2"
  >
    <button
      aria-label="Rückgängig"
      class="flex size-11 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
      @click="undo()"
    >
      <UIcon name="i-lucide-undo-2" class="size-6" />
    </button>
    <button
      aria-label="Wiederholen"
      class="flex size-11 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
      @click="redo()"
    >
      <UIcon name="i-lucide-redo-2" class="size-6" />
    </button>
  </div>

  <!-- Bottom bar -->
  <nav
    v-if="!isUiHidden"
    class="absolute inset-x-0 bottom-0 z-20 flex gap-2 border-t border-slate-200/80 bg-white/85 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-800/85"
  >
    <button
      :class="[barButtonBase, barButtonState('color')]"
      @click="toggle('color')"
    >
      <span class="relative flex items-center justify-center">
        <UIcon name="i-lucide-palette" class="size-7" />
        <span
          class="absolute -right-1 -top-1 size-3 rounded-full border border-white dark:border-slate-800"
          :style="{ backgroundColor: selectedColor }"
        />
      </span>
      <span>Farbe</span>
    </button>

    <button
      :class="[barButtonBase, barButtonState('size')]"
      @click="toggle('size')"
    >
      <span class="flex size-7 items-center justify-center">
        <span class="rounded-full bg-current" :style="sizeDotStyle" />
      </span>
      <span>Größe</span>
    </button>

    <button
      :class="[barButtonBase, barButtonState('more')]"
      @click="toggle('more')"
    >
      <UIcon name="i-lucide-plus" class="size-7" />
      <span>Mehr</span>
    </button>
  </nav>

  <!-- Fullscreen mode: the lone button that brings the UI back -->
  <button
    v-if="isUiHidden"
    aria-label="Bedienung anzeigen"
    class="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 flex size-11 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
    @click="showUi()"
  >
    <UIcon name="i-lucide-eye" class="size-6" />
  </button>

  <ToolbarColorPanel
    :open="activePanel === 'color'"
    @update:open="(v) => setOpen('color', v)"
  />
  <ToolbarSizePanel
    :open="activePanel === 'size'"
    @update:open="(v) => setOpen('size', v)"
  />
  <ToolbarMorePanel
    :open="activePanel === 'more'"
    @update:open="(v) => setOpen('more', v)"
  />
</template>

<script setup lang="ts">
import { injectToolbar } from "~/composables/useToolbar";

type Panel = "color" | "size" | "more";

const { selectedColor, selectedSize, undo, redo, isUiHidden, showUi } =
  injectToolbar();

const activePanel = ref<Panel | null>(null);

function toggle(panel: Panel) {
  activePanel.value = activePanel.value === panel ? null : panel;
}

function setOpen(panel: Panel, open: boolean) {
  if (open) activePanel.value = panel;
  else if (activePanel.value === panel) activePanel.value = null;
}

const barButtonBase =
  "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-colors";

function barButtonState(panel: Panel) {
  return activePanel.value === panel
    ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
    : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50";
}

const sizeDotStyle = computed(() => {
  const diameter = Math.min(Math.round(6 + selectedSize.value / 12), 24);
  return { width: `${diameter}px`, height: `${diameter}px` };
});
</script>
