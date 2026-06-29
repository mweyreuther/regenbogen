export function useDrawingCanvas() {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const isDrawing = ref(false);
  const brushColor = ref("#39ff14");
  const brushSize = ref(36);
  const history = ref<ImageData[]>([]);
  const redoStack = ref<ImageData[]>([]);
  const maxHistory = 30;
  const strokePoints = ref<Array<{ x: number; y: number }>>([]);
  const rainbowMode = ref(false);
  const neonGlow = ref(true);
  let rainbowHue = 0;
  let lastPos: { x: number; y: number } | null = null;
  let cachedCtx: CanvasRenderingContext2D | null = null;
  let cachedRect: DOMRect | null = null;

  function getCtx() {
    if (cachedCtx) return cachedCtx;
    cachedCtx =
      canvasRef.value?.getContext("2d", { willReadFrequently: true }) ?? null;
    return cachedCtx;
  }

  function invalidateCache() {
    cachedCtx = null;
    cachedRect = null;
    history.value = [];
    redoStack.value = [];
  }

  function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } | null {
    const canvas = canvasRef.value;
    if (!canvas) return null;
    if (!cachedRect) cachedRect = canvas.getBoundingClientRect();
    const rect = cachedRect;
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

  function saveToHistory() {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas) return;
    if (history.value.length >= maxHistory) {
      history.value.shift();
    }
    history.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    // A fresh action invalidates anything that was undone.
    redoStack.value = [];
  }

  function applyGlow(ctx: CanvasRenderingContext2D, color: string) {
    if (neonGlow.value) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }

  function startStroke(e: MouseEvent | TouchEvent) {
    const ctx = getCtx();
    const pos = getPos(e);
    if (!ctx || !pos) return;

    saveToHistory();
    isDrawing.value = true;
    lastPos = pos;

    if (!rainbowMode.value) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = brushColor.value;
      ctx.lineWidth = brushSize.value;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      applyGlow(ctx, brushColor.value);
    }
  }

  function continueStroke(e: MouseEvent | TouchEvent) {
    if (!isDrawing.value) return;
    const ctx = getCtx();
    const pos = getPos(e);
    if (!ctx || !pos) return;

    if (rainbowMode.value) {
      if (lastPos) {
        const color = `hsl(${rainbowHue}, 90%, 55%)`;
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (neonGlow.value) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 18;
        }
        ctx.stroke();
        rainbowHue = (rainbowHue + 4) % 360;
      }
      lastPos = pos;
    } else {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  }

  function continueStrokeWithTracking(e: MouseEvent | TouchEvent) {
    continueStroke(e);
    if (isDrawing.value) {
      const pos = getPos(e);
      if (pos) strokePoints.value.push(pos);
    }
  }

  function endStroke() {
    isDrawing.value = false;
    const ctx = getCtx();
    if (ctx) {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }

  function undo() {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas || history.value.length === 0) return;
    redoStack.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    const prev = history.value.pop()!;
    ctx.putImageData(prev, 0, 0);
  }

  function redo() {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas || redoStack.value.length === 0) return;
    if (history.value.length >= maxHistory) {
      history.value.shift();
    }
    history.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    const next = redoStack.value.pop()!;
    ctx.putImageData(next, 0, 0);
  }

  function clear() {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas) return;
    saveToHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function fillBackground(kind: "pattern" | "gradient" | "rainbow") {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas) return;
    saveToHistory();
    const w = canvas.width;
    const h = canvas.height;

    // Compose the fill on an offscreen canvas, then paint it behind the
    // existing drawing with destination-over so strokes stay on top.
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d");
    if (!octx) return;

    if (kind === "gradient") {
      const hueA = Math.random() * 360;
      const hueB = (hueA + 90 + Math.random() * 180) % 360;
      const g = octx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${hueA}, 85%, 62%)`);
      g.addColorStop(1, `hsl(${hueB}, 85%, 62%)`);
      octx.fillStyle = g;
      octx.fillRect(0, 0, w, h);
    } else if (kind === "pattern") {
      const baseHue = Math.random() * 360;
      octx.fillStyle = `hsl(${baseHue}, 70%, 88%)`;
      octx.fillRect(0, 0, w, h);
      octx.fillStyle = `hsl(${(baseHue + 180) % 360}, 70%, 58%)`;
      const step = Math.max(40, Math.round(w / 7));
      const r = step * 0.18;
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          octx.beginPath();
          octx.arc(x, y, r, 0, Math.PI * 2);
          octx.fill();
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
          octx.fillStyle = `hsl(${Math.random() * 360}, 85%, 60%)`;
          octx.fillRect(i * cw, j * ch, cw + 1, ch + 1);
        }
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }

  let snakeHue = 0;

  function drawSnakeSegment(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width = 12,
  ) {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (rainbowMode.value) {
      const color = `hsl(${snakeHue}, 90%, 55%)`;
      ctx.strokeStyle = color;
      if (neonGlow.value) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      snakeHue = (snakeHue + 4) % 360;
    } else {
      ctx.strokeStyle = brushColor.value;
      applyGlow(ctx, brushColor.value);
      ctx.stroke();
    }
  }

  // One history snapshot per run, so a single undo removes the whole trail.
  function beginSnakeRun() {
    saveToHistory();
  }

  function endSnakeRun() {
    const ctx = getCtx();
    if (ctx) {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }

  function exportImage(): string {
    const canvas = canvasRef.value;
    if (!canvas) return "";

    const maxWidth = 800;
    if (canvas.width <= maxWidth) {
      return canvas.toDataURL("image/jpeg", 0.7);
    }

    const scale = maxWidth / canvas.width;
    const offscreen = document.createElement("canvas");
    offscreen.width = maxWidth;
    offscreen.height = canvas.height * scale;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
    return offscreen.toDataURL("image/jpeg", 0.7);
  }

  function setBackground(svgDataUrl: string, alpha = 0.15) {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas) return;

    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    };
    img.src = svgDataUrl;
  }

  function clearStrokePoints() {
    strokePoints.value = [];
  }

  return {
    canvasRef,
    isDrawing,
    brushColor,
    brushSize,
    history,
    startStroke,
    continueStroke,
    continueStrokeWithTracking,
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
    strokePoints,
    clearStrokePoints,
    rainbowMode,
    neonGlow,
    invalidateCache,
  };
}
