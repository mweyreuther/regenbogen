import { animate } from "animejs";

export type CanvasRef = {
  undo: () => void;
  clear: () => void;
  exportImage: () => string | null;
  brushColor: string;
  brushSize: number;
  blinkMode: boolean;
  setBlinkMode: (enabled: boolean) => void;
  rainbowMode: boolean;
  neonGlow: boolean;
};

const normalColors = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a78bfa",
  "#ec4899",
];
const neonColors = [
  "#ffffff",
  "#ff073a",
  "#ff6600",
  "#ffff00",
  "#39ff14",
  "#00ffff",
  "#bf00ff",
  "#ff69b4",
];

export const brushSizes = [
  { label: "S", value: 12 },
  { label: "M", value: 36 },
  { label: "L", value: 120 },
];

export function useToolbar(canvasComponent: Ref<CanvasRef | null>) {
  const isNeon = ref(true);
  const colors = computed(() => (isNeon.value ? neonColors : normalColors));

  const selectedColor = ref("#39ff14");
  const selectedSize = ref(36);
  const isEraser = ref(false);
  const isBlink = ref(false);
  const isRainbow = ref(false);
  const previousColor = ref("#000000");
  const colorMode = useColorMode();
  const eraserColor = computed(() =>
    colorMode.value === "dark" ? "#1e293b" : "#ffffff",
  );

  const { playClick } = useSoundEffects();

  function toggleNeon() {
    isNeon.value = !isNeon.value;
    if (canvasComponent.value) canvasComponent.value.neonGlow = isNeon.value;
    const fromPalette = isNeon.value ? normalColors : neonColors;
    const toPalette = isNeon.value ? neonColors : normalColors;
    const idx = fromPalette.indexOf(selectedColor.value);
    const newColor = idx >= 0 ? toPalette[idx]! : toPalette[0]!;
    selectedColor.value = newColor;
    if (canvasComponent.value && !isEraser.value) {
      canvasComponent.value.brushColor = newColor;
    }
  }

  function setColor(color: string, event?: MouseEvent) {
    playClick();
    isEraser.value = false;
    if (isRainbow.value) {
      isRainbow.value = false;
      if (canvasComponent.value) canvasComponent.value.rainbowMode = false;
    }
    selectedColor.value = color;
    if (canvasComponent.value) {
      canvasComponent.value.brushColor = color;
    }
    if (
      event?.currentTarget &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      animate(event.currentTarget as HTMLElement, {
        scale: [1, 1.3, 1],
        duration: 300,
        ease: "outBack(2)",
      });
    }
  }

  function setSize(size: number) {
    selectedSize.value = size;
    if (canvasComponent.value) {
      canvasComponent.value.brushSize = size;
    }
  }

  function disableEraser() {
    if (isEraser.value) {
      isEraser.value = false;
      if (canvasComponent.value) {
        canvasComponent.value.brushColor = previousColor.value;
        canvasComponent.value.neonGlow = isNeon.value;
        selectedColor.value = previousColor.value;
      }
    }
  }

  function toggleRainbow() {
    disableEraser();
    isRainbow.value = !isRainbow.value;
    if (canvasComponent.value) canvasComponent.value.rainbowMode = isRainbow.value;
  }

  function toggleBlink() {
    disableEraser();
    isBlink.value = !isBlink.value;
    if (canvasComponent.value) {
      if (isBlink.value) canvasComponent.value.brushColor = selectedColor.value;
    }
    canvasComponent.value?.setBlinkMode(isBlink.value);
  }

  function toggleEraser() {
    const wasOn = isEraser.value;
    if (!wasOn) {
      if (isRainbow.value) {
        isRainbow.value = false;
        if (canvasComponent.value) canvasComponent.value.rainbowMode = false;
      }
      if (isBlink.value) {
        isBlink.value = false;
        canvasComponent.value?.setBlinkMode(false);
      }
      isEraser.value = true;
      if (canvasComponent.value) {
        previousColor.value = selectedColor.value;
        canvasComponent.value.brushColor = eraserColor.value;
        canvasComponent.value.neonGlow = false;
      }
    } else {
      disableEraser();
    }
  }

  return {
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
  };
}