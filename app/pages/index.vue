<template>
  <div class="relative min-h-0 flex-1 overflow-hidden">
    <UiDrawingCanvas ref="canvasComponent" />

    <!-- Clear wipe overlay -->
    <div
      ref="wipeRef"
      class="pointer-events-none absolute inset-0 z-30 origin-left scale-x-0 bg-white dark:bg-slate-800"
    />

    <!-- Floating toolbar -->
    <div
      class="absolute bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/90"
    >
      <div class="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
        <ToolbarColorPicker
          :colors="colors"
          :selected-color="selectedColor"
          :is-neon="isNeon"
          :is-eraser="isEraser"
          @select="setColor"
          @toggle-neon="toggleNeon"
        />

        <div class="flex items-center gap-1.5">
          <ToolbarBrushSizeSelector
            :sizes="brushSizes"
            :selected-size="selectedSize"
            @select="setSize"
          />

          <div class="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-600" />

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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { animate } from "animejs";
import type { CanvasRef } from "~/composables/useToolbar";

const canvasComponent = ref<CanvasRef | null>(null);
const wipeRef = ref<HTMLElement | null>(null);

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
