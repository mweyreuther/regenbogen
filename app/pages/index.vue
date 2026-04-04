<template>
  <div class="flex min-h-0 flex-1 flex-col mobile-landscape:flex-row bg-white dark:bg-slate-800">
  <header
    class="flex h-14 shrink-0 items-center justify-center border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md mobile-landscape:h-auto mobile-landscape:w-14 mobile-landscape:flex-col mobile-landscape:border-b-0 mobile-landscape:border-r mobile-landscape:px-0 mobile-landscape:py-4 dark:border-slate-700/80 dark:bg-slate-800/80"
  >
    <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
      <div class="order-1 mobile-landscape:order-5 flex items-center gap-1.5 mobile-landscape:flex-col">
        <ToolbarBrushSizeSelector :sizes="brushSizes" :selected-size="selectedSize" @select="setSize" />
      </div>
      <div class="order-2 mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:order-6 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600" />
      <div class="order-3 mobile-landscape:order-7 flex items-center gap-1.5 mobile-landscape:flex-col">
        <ToolbarBrushEffects :is-rainbow="isRainbow" :is-blink="isBlink" @toggle-rainbow="toggleRainbow" @toggle-blink="toggleBlink" />
      </div>
      <div class="order-4 mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:order-8 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600" />
      <div class="order-5 mobile-landscape:order-9 flex items-center gap-1.5 mobile-landscape:flex-col">
        <ToolbarEditActions :is-eraser="isEraser" @toggle-eraser="toggleEraser" @undo="canvasComponent?.undo()" @clear="clearWithWipe" />
      </div>
      <div class="order-6 mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:order-4 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600" />
      <div class="order-7 mobile-landscape:order-3 flex items-center gap-1.5 mobile-landscape:flex-col">
        <ToolbarExportActions @save="saveDrawing" @share="shareDrawing" />
      </div>
      <div class="order-8 mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:order-2 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600" />
      <div class="order-9 mobile-landscape:order-1 flex items-center gap-1.5 mobile-landscape:flex-col">
        <button class="flex items-center justify-center" @click="toggleColorMode">
          <UIcon
            :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
            class="size-5 text-slate-400 dark:text-slate-300"
          />
        </button>
      </div>
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
      @custom="setColor"
      @toggle-neon="toggleNeon"
    />
  </footer>
  </div>
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
