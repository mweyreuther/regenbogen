<template>
  <div
    ref="wrapperRef"
    class="relative h-full w-full bg-white dark:bg-slate-800"
  >
    <canvas
      ref="bgRef"
      class="pointer-events-none absolute inset-0 block h-full w-full"
    />
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block h-full w-full touch-none"
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
  drawSnakeSegment,
  beginSnakeRun,
  endSnakeRun,
  stamp,
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
const bgRef = ref<HTMLCanvasElement | null>(null);
const overlayRef = ref<HTMLCanvasElement | null>(null);
const blinkMode = ref(false);
const hasBlinkStroke = ref(false);
const isOverlayDrawing = ref(false);
const snakeActive = ref(false);
const stampEmoji = ref<string | null>(null);

function setStamp(emoji: string | null) {
  stampEmoji.value = emoji;
}

// Position relative to the main canvas (always visible, unlike the overlay).
function getCanvasPos(
  e: MouseEvent | TouchEvent,
): { x: number; y: number } | null {
  const canvas = canvasRef.value;
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

function getBgCtx() {
  return bgRef.value?.getContext("2d") ?? null;
}

function renderFill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  kind: "pattern" | "gradient" | "rainbow",
) {
  if (kind === "gradient") {
    const hueA = Math.random() * 360;
    const hueB = (hueA + 90 + Math.random() * 180) % 360;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hueA}, 85%, 62%)`);
    g.addColorStop(1, `hsl(${hueB}, 85%, 62%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (kind === "pattern") {
    const baseHue = Math.random() * 360;
    ctx.fillStyle = `hsl(${baseHue}, 70%, 88%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `hsl(${(baseHue + 180) % 360}, 70%, 58%)`;
    const step = Math.max(40, Math.round(w / 7));
    const r = step * 0.18;
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Random rainbow patchwork.
    const cols = 6;
    const rows = Math.max(1, Math.round((cols * h) / w));
    const cw = w / cols;
    const ch = h / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 85%, 60%)`;
        ctx.fillRect(i * cw, j * ch, cw + 1, ch + 1);
      }
    }
  }
}

// The background is its own canvas layer below the drawing, so choosing a new
// fill simply replaces it without touching the strokes on top.
function fillBackground(kind: "pattern" | "gradient" | "rainbow") {
  const ctx = getBgCtx();
  const canvas = bgRef.value;
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderFill(ctx, canvas.width, canvas.height, kind);
}

function clearBackground() {
  const ctx = getBgCtx();
  const canvas = bgRef.value;
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function exportImage(): string {
  const main = canvasRef.value;
  if (!main) return "";
  const maxWidth = 800;
  const scale = main.width > maxWidth ? maxWidth / main.width : 1;
  const outW = Math.round(main.width * scale);
  const outH = Math.round(main.height * scale);
  const off = document.createElement("canvas");
  off.width = outW;
  off.height = outH;
  const ctx = off.getContext("2d");
  if (!ctx) return "";
  // Solid base so transparent areas don't export as black in JPEG.
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, outW, outH);
  if (bgRef.value) ctx.drawImage(bgRef.value, 0, 0, outW, outH);
  ctx.drawImage(main, 0, 0, outW, outH);
  return off.toDataURL("image/jpeg", 0.7);
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
  if (stampEmoji.value) {
    const pos = getCanvasPos(e);
    if (pos) stamp(pos.x, pos.y, stampEmoji.value);
    return;
  }
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
  clearBackground();
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
  const bg = bgRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (w === 0 || h === 0) return;
  if (canvas.width === w && canvas.height === h) return;

  const mainSnap = snapshot(canvas);
  const overlaySnap = overlay ? snapshot(overlay) : null;
  const bgSnap = bg ? snapshot(bg) : null;

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

  if (bg) {
    bg.width = w;
    bg.height = h;
    if (bgSnap) {
      getBgCtx()?.drawImage(
        bgSnap,
        0,
        0,
        bgSnap.width,
        bgSnap.height,
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
  setStamp,
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
