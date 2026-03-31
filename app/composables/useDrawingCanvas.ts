export function useDrawingCanvas() {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const isDrawing = ref(false);
  const brushColor = ref("#22c55e");
  const brushSize = ref(24);
  const history = ref<ImageData[]>([]);
  const maxHistory = 30;
  const strokePoints = ref<Array<{ x: number; y: number }>>([]);
  const rainbowMode = ref(false);
  const neonGlow = ref(false);
  let rainbowHue = 0;
  let lastPos: { x: number; y: number } | null = null;

  function getCtx() {
    return canvasRef.value?.getContext("2d") ?? null;
  }

  function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } | null {
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

  function saveToHistory() {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas) return;
    if (history.value.length >= maxHistory) {
      history.value.shift();
    }
    history.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
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
        applyGlow(ctx, color);
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
    const prev = history.value.pop()!;
    ctx.putImageData(prev, 0, 0);
  }

  function clear() {
    const ctx = getCtx();
    const canvas = canvasRef.value;
    if (!ctx || !canvas) return;
    saveToHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    clear,
    exportImage,
    setBackground,
    strokePoints,
    clearStrokePoints,
    rainbowMode,
    neonGlow,
  };
}
