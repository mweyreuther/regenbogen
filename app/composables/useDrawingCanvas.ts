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

  function stamp(x: number, y: number, emoji: string) {
    const ctx = getCtx();
    if (!ctx) return;
    saveToHistory();
    const size = Math.max(48, brushSize.value * 1.8);
    const angle = ((Math.random() * 90 - 45) * Math.PI) / 180; // -45°..+45°
    ctx.save();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `${size}px "Sour Gummy", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
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
    drawSnakeSegment,
    beginSnakeRun,
    endSnakeRun,
    stamp,
    setBackground,
    strokePoints,
    clearStrokePoints,
    rainbowMode,
    neonGlow,
    invalidateCache,
  };
}
