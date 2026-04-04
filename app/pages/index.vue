<template>
  <div class="flex min-h-0 flex-1 flex-col mobile-landscape:flex-row bg-white dark:bg-slate-800">
    <AppHeader
      :sizes="brushSizes"
      :selected-size="selectedSize"
      :is-rainbow="isRainbow"
      :is-blink="isBlink"
      :is-eraser="isEraser"
      @save="saveDrawing"
      @share="shareDrawing"
      @select-size="setSize"
      @toggle-rainbow="toggleRainbow"
      @toggle-blink="toggleBlink"
      @toggle-eraser="toggleEraser"
      @undo="canvasComponent?.undo()"
      @clear="clearWithWipe"
    />

    <div class="relative min-h-0 flex-1 overflow-hidden">
      <UiDrawingCanvas ref="canvasComponent" />

      <!-- Clear wipe overlay -->
      <div
        ref="wipeRef"
        class="pointer-events-none absolute inset-0 z-30 origin-left scale-x-0 bg-white dark:bg-slate-800"
      />
    </div>

    <AppFooter
      :colors="colors"
      :selected-color="selectedColor"
      :is-neon="isNeon"
      :is-eraser="isEraser"
      @select="setColor"
      @custom="setColor"
      @toggle-neon="toggleNeon"
    />
  </div>
</template>

<script setup lang="ts">
import { animate } from "animejs";
import { brushSizes, type CanvasRef } from "~/composables/useToolbar";

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

function getDrawingFile(): File | null {
  const dataUrl = canvasComponent.value?.exportImage();
  if (!dataUrl) return null;
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(base64!);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], "regenbogen.jpg", { type: mime });
}

async function saveDrawing() {
  const file = getDrawingFile();
  if (!file) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function shareDrawing() {
  const file = getDrawingFile();
  if (!file) return;
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: "Regenbogen", files: [file] });
  } else {
    await saveDrawing();
  }
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
