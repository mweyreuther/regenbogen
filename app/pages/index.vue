<template>
  <div
    class="relative h-full w-full overflow-hidden bg-white dark:bg-slate-800"
  >
    <UiDrawingCanvas ref="canvasComponent" />

    <!-- Clear wipe overlay -->
    <div
      ref="wipeRef"
      class="pointer-events-none absolute inset-0 z-10 origin-left scale-x-0 bg-white dark:bg-slate-800"
    />

    <ToolbarBottomToolbar />
    <UiRotateNotice />
  </div>
</template>

<script setup lang="ts">
import { animate } from "animejs";
import {
  toolbarKey,
  type CanvasRef,
  type ToolbarContext,
} from "~/composables/useToolbar";

// Dark mode only: force it for this page regardless of any stored preference.
definePageMeta({ colorMode: "dark" });

const canvasComponent = ref<CanvasRef | null>(null);
const wipeRef = ref<HTMLElement | null>(null);

const toolbar = useToolbar(canvasComponent);

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

const toolbarContext: ToolbarContext = {
  ...toolbar,
  undo: () => canvasComponent.value?.undo(),
  redo: () => canvasComponent.value?.redo(),
  clear: clearWithWipe,
  fillBackground: (kind) => canvasComponent.value?.fillBackground(kind),
  save: saveDrawing,
  share: shareDrawing,
  reload: () => window.location.reload(),
};

provide(toolbarKey, toolbarContext);
</script>
