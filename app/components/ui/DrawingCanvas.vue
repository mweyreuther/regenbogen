<template>
  <div ref="wrapperRef" class="relative h-full w-full">
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block h-full w-full touch-none bg-white dark:bg-slate-800"
      @mousedown="onStart"
      @mousemove="onMove"
      @mouseup="onEnd"
      @mouseleave="onEnd"
      @touchstart="onStart"
      @touchmove="onMove"
      @touchend="onEnd"
    />
    <canvas
      v-show="hasBlinkStroke || isOverlayDrawing || snakeActive"
      ref="overlayRef"
      class="pointer-events-none absolute inset-0 block h-full w-full"
      :class="{ 'animate-blink': hasBlinkStroke }"
    />
  </div>
</template>

<script setup lang="ts">
const {
  canvasRef,
  startStroke,
  continueStroke,
  endStroke,
  undo,
  redo,
  clear,
  fillBackground,
  drawSnakeSegment,
  beginSnakeRun,
  endSnakeRun,
  exportImage,
  setBackground,
  brushColor,
  brushSize,
  rainbowMode,
  neonGlow,
  invalidateCache,
} = useDrawingCanvas();

const emit = defineEmits<{
  resize: [];
  manualstart: [];
}>();

const wrapperRef = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLCanvasElement | null>(null);
const blinkMode = ref(false);
const hasBlinkStroke = ref(false);
const isOverlayDrawing = ref(false);
const snakeActive = ref(false);

function getOverlayCtx() {
  return overlayRef.value?.getContext("2d") ?? null;
}

function setSnakeActive(active: boolean) {
  snakeActive.value = active;
}

function drawSnakePointer(x: number, y: number, radius: number) {
  const ctx = getOverlayCtx();
  const canvas = overlayRef.value;
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#0f172a";
  ctx.stroke();
}

function clearSnakeOverlay() {
  const ctx = getOverlayCtx();
  const canvas = overlayRef.value;
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getOverlayPos(
  e: MouseEvent | TouchEvent,
): { x: number; y: number } | null {
  const canvas = overlayRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ("touches" in e) {
    const touch = e.touches[0];
    if (!touch) return null;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function clearOverlay() {
  const ctx = getOverlayCtx();
  const canvas = overlayRef.value;
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasBlinkStroke.value = false;
}

let overlayLastPos: { x: number; y: number } | null = null;
let overlayRainbowHue = 0;

function preventTouch(e: Event) {
  if (e.cancelable) e.preventDefault();
}

function onStart(e: MouseEvent | TouchEvent) {
  preventTouch(e);
  emit("manualstart");
  if (blinkMode.value) {
    const ctx = getOverlayCtx();
    const pos = getOverlayPos(e);
    if (!ctx || !pos) return;

    isOverlayDrawing.value = true;
    overlayLastPos = pos;

    if (!rainbowMode.value) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = brushColor.value;
      ctx.lineWidth = brushSize.value;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  } else {
    startStroke(e);
  }
}

function onMove(e: MouseEvent | TouchEvent) {
  preventTouch(e);
  if (blinkMode.value && isOverlayDrawing.value) {
    const ctx = getOverlayCtx();
    const pos = getOverlayPos(e);
    if (!ctx || !pos) return;

    if (rainbowMode.value && overlayLastPos) {
      ctx.beginPath();
      ctx.moveTo(overlayLastPos.x, overlayLastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = `hsl(${overlayRainbowHue}, 90%, 55%)`;
      ctx.lineWidth = brushSize.value;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      overlayRainbowHue = (overlayRainbowHue + 4) % 360;
      overlayLastPos = pos;
    } else {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  } else {
    continueStroke(e);
  }
}

function onEnd() {
  if (blinkMode.value && isOverlayDrawing.value) {
    isOverlayDrawing.value = false;
    hasBlinkStroke.value = true;
  } else {
    endStroke();
  }
}

function setBlinkMode(enabled: boolean) {
  blinkMode.value = enabled;
}

function clearAll() {
  clearOverlay();
  clear();
}

function undoAll() {
  if (hasBlinkStroke.value) {
    clearOverlay();
  } else {
    undo();
  }
}

// Resize canvas resolution to match displayed size.
// Setting canvas.width/height clears the bitmap, so we snapshot the current
// pixels, resize, then redraw them (scaled) — otherwise a resize such as an
// orientation flip or browser-chrome change blanks the drawing.
let resizeObserver: ResizeObserver | null = null;

function snapshot(source: HTMLCanvasElement): HTMLCanvasElement | null {
  if (source.width === 0 || source.height === 0) return null;
  const copy = document.createElement("canvas");
  copy.width = source.width;
  copy.height = source.height;
  copy.getContext("2d")?.drawImage(source, 0, 0);
  return copy;
}

function fitCanvas() {
  const canvas = canvasRef.value;
  const overlay = overlayRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (w === 0 || h === 0) return;
  if (canvas.width === w && canvas.height === h) return;

  const mainSnap = snapshot(canvas);
  const overlaySnap = overlay ? snapshot(overlay) : null;

  canvas.width = w;
  canvas.height = h;
  invalidateCache();
  if (mainSnap) {
    canvas
      .getContext("2d", { willReadFrequently: true })
      ?.drawImage(mainSnap, 0, 0, mainSnap.width, mainSnap.height, 0, 0, w, h);
  }

  if (overlay) {
    overlay.width = w;
    overlay.height = h;
    if (overlaySnap) {
      getOverlayCtx()?.drawImage(
        overlaySnap,
        0,
        0,
        overlaySnap.width,
        overlaySnap.height,
        0,
        0,
        w,
        h,
      );
    }
  }

  emit("resize");
}

onMounted(() => {
  resizeObserver = new ResizeObserver(() => fitCanvas());
  if (canvasRef.value) {
    resizeObserver.observe(canvasRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

defineExpose({
  undo: undoAll,
  redo,
  clear: clearAll,
  fillBackground,
  drawSnakeSegment,
  beginSnakeRun,
  endSnakeRun,
  drawSnakePointer,
  clearSnakeOverlay,
  setSnakeActive,
  exportImage,
  setBackground,
  brushColor,
  brushSize,
  canvasRef,
  blinkMode,
  setBlinkMode,
  rainbowMode,
  neonGlow,
});
</script>

<style scoped>
.animate-blink {
  animation: blink 0.6s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.15;
  }
}
</style>
