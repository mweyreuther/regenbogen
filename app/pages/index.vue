<template>
  <header
    class="flex h-14 shrink-0 items-center justify-center border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md mobile-landscape:h-auto mobile-landscape:w-14 mobile-landscape:flex-col mobile-landscape:border-b-0 mobile-landscape:border-r mobile-landscape:px-0 mobile-landscape:py-4 dark:border-slate-700/80 dark:bg-slate-800/80"
  >
    <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
      <ToolbarBrushSizeSelector
        :sizes="brushSizes"
        :selected-size="selectedSize"
        @select="setSize"
      />

      <div class="mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600" />

      <ToolbarActions
        :is-rainbow="isRainbow"
        :is-blink="isBlink"
        :is-eraser="isEraser"
        @toggle-rainbow="toggleRainbow"
        @toggle-blink="toggleBlink"
        @toggle-eraser="toggleEraser"
        @undo="canvasComponent?.undo()"
        @clear="clearWithWipe"
      />

      <div class="mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600" />

      <button class="flex items-center justify-center" @click="toggleColorMode">
        <UIcon
          :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          class="size-5 text-slate-400 dark:text-slate-300"
        />
      </button>
    </div>
  </header>

  <div class="relative min-h-0 flex-1 overflow-hidden">
    <UiDrawingCanvas ref="canvasComponent" />

    <!-- Clear wipe overlay -->
    <div
      ref="wipeRef"
      class="pointer-events-none absolute inset-0 z-30 origin-left scale-x-0 bg-white dark:bg-slate-800"
    />
  </div>

  <footer
    class="flex h-14 shrink-0 items-center justify-center border-t border-slate-200/80 bg-white/80 px-4 backdrop-blur-md mobile-landscape:h-auto mobile-landscape:w-14 mobile-landscape:flex-col mobile-landscape:border-t-0 mobile-landscape:border-l mobile-landscape:px-0 mobile-landscape:py-4 dark:border-slate-700/80 dark:bg-slate-800/80"
  >
    <ToolbarColorPicker
      :colors="colors"
      :selected-color="selectedColor"
      :is-neon="isNeon"
      :is-eraser="isEraser"
      @select="setColor"
      @toggle-neon="toggleNeon"
    />
  </footer>
</template>

<script setup lang="ts">
import { animate } from "animejs";
import { brushSizes, type CanvasRef } from "~/composables/useToolbar";

const canvasComponent = ref<CanvasRef | null>(null);
const wipeRef = ref<HTMLElement | null>(null);
const colorMode = useColorMode();

const {
  isNeon,
  colors,
  selectedColor,
  selectedSize,
  isEraser,
  isBlink,
  isRainbow,
  toggleNeon,
  setColor,
  setSize,
  toggleRainbow,
  toggleBlink,
  toggleEraser,
} = useToolbar(canvasComponent);

function toggleColorMode() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}

function clearWithWipe() {
  if (
    !wipeRef.value ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    canvasComponent.value?.clear();
    return;
  }
  const el = wipeRef.value;
  animate(el, {
    scaleX: [0, 1],
    duration: 300,
    ease: "inQuad",
    onComplete: () => {
      canvasComponent.value?.clear();
      animate(el, {
        scaleX: [1, 0],
        duration: 300,
        ease: "outQuad",
      });
    },
  });
}
</script>
