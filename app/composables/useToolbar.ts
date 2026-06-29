import { animate } from "animejs";
import type { ComputedRef, InjectionKey, Ref } from "vue";

export type CanvasRef = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  fillBackground: (kind: "pattern" | "gradient" | "rainbow") => void;
  exportImage: () => string | null;
  brushColor: string;
  brushSize: number;
  blinkMode: boolean;
  setBlinkMode: (enabled: boolean) => void;
  rainbowMode: boolean;
  neonGlow: boolean;
};

// Index 0 is white in both palettes so the neon toggle never flips it away.
// The remaining entries are hue-aligned between the two palettes.
const normalColors = [
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#d946ef",
  "#ec4899",
];
const neonColors = [
  "#ffffff",
  "#ff073a",
  "#ff6600",
  "#ff9500",
  "#ffe600",
  "#ccff00",
  "#39ff14",
  "#00ff9f",
  "#00ffcc",
  "#00ffff",
  "#00b3ff",
  "#4d6bff",
  "#bf00ff",
  "#e600ff",
  "#ff4fd8",
];

export const brushSizes = [
  { label: "S", value: 12 },
  { label: "M", value: 36 },
  { label: "L", value: 120 },
  { label: "XL", value: 240 },
];

/**
 * Shape of the toolbar state shared with the bottom toolbar and its panels via
 * provide/inject, so panels don't need deep prop-drilling. Built in index.vue
 * from useToolbar() plus the canvas-bound actions (undo/clear/save/share/reload).
 */
export interface ToolbarContext {
  isNeon: Ref<boolean>;
  colors: ComputedRef<string[]>;
  selectedColor: Ref<string>;
  selectedSize: Ref<number>;
  isEraser: Ref<boolean>;
  isBlink: Ref<boolean>;
  isRainbow: Ref<boolean>;
  eraserColor: ComputedRef<string>;
  toggleNeon: () => void;
  setColor: (color: string, event?: MouseEvent) => void;
  setSize: (size: number) => void;
  toggleRainbow: () => void;
  toggleBlink: () => void;
  toggleEraser: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  fillBackground: (kind: "pattern" | "gradient" | "rainbow") => void;
  save: () => void | Promise<void>;
  share: () => void | Promise<void>;
  reload: () => void;
}

export const toolbarKey: InjectionKey<ToolbarContext> = Symbol("toolbar");

export function injectToolbar(): ToolbarContext {
  const ctx = inject(toolbarKey);
  if (!ctx) throw new Error("Toolbar context not provided");
  return ctx;
}

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
      // Restore glow to match neon mode (it gets switched off while erasing).
      canvasComponent.value.neonGlow = isNeon.value;
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
    if (canvasComponent.value)
      canvasComponent.value.rainbowMode = isRainbow.value;
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
    eraserColor,
    toggleNeon,
    setColor,
    setSize,
    toggleRainbow,
    toggleBlink,
    toggleEraser,
  };
}
