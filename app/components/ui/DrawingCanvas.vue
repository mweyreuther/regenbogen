<template>
  <div ref="wrapperRef" class="relative h-full w-full">
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block h-full w-full touch-none bg-white dark:bg-slate-800"
      @mousedown="onStart"
      @mousemove="onMove"
      @mouseup="onEnd"
      @mouseleave="onEnd"
      @touchstart.prevent="onStart"
      @touchmove.prevent="onMove"
      @touchend="onEnd"
    />
    <canvas
      v-show="hasBlinkStroke || isOverlayDrawing"
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
  clear,
  exportImage,
  setBackground,
  brushColor,
  brushSize,
  rainbowMode,
  neonGlow,
} = useDrawingCanvas();

const emit = defineEmits<{
  resize: [];
}>();

const wrapperRef = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLCanvasElement | null>(null);
const blinkMode = ref(false);
const hasBlinkStroke = ref(false);
const isOverlayDrawing = ref(false);

function getOverlayCtx() {
  return overlayRef.value?.getContext("2d") ?? null;
}

function getOverlayPos(e: MouseEvent | TouchEvent): { x: number; y: number } | null {
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

function onStart(e: MouseEvent | TouchEvent) {
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

// Resize canvas resolution to match displayed size
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    const canvas = canvasRef.value;
    const overlay = overlayRef.value;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    canvas.width = w;
    canvas.height = h;
    if (overlay) {
      overlay.width = w;
      overlay.height = h;
    }
    emit("resize");
  });
  if (canvasRef.value) {
    resizeObserver.observe(canvasRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

defineExpose({
  undo: undoAll,
  clear: clearAll,
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
