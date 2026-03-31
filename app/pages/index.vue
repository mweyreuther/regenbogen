<template>
  <div class="relative min-h-0 flex-1 overflow-hidden">
    <UiDrawingCanvas ref="canvasComponent" />
    <!-- Clear wipe overlay -->
    <div
      ref="wipeRef"
      class="pointer-events-none absolute inset-0 z-30 origin-left scale-x-0 bg-white dark:bg-slate-800"
    />

    <!-- Floating toolbar -->
    <div
      class="absolute bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/90"
    >
      <div class="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
        <!-- Colors -->
        <div class="flex items-center gap-1.5">
          <button
            class="flex size-6 items-center justify-center rounded-full border-2 transition-transform sm:size-7"
            :class="
              isNeon
                ? 'border-slate-700 bg-slate-900 dark:border-white'
                : 'border-slate-300 bg-slate-100 dark:border-slate-500 dark:bg-slate-700'
            "
            @click="toggleNeon"
          >
            <UIcon
              name="i-lucide-zap"
              class="size-3.5 sm:size-4"
              :class="isNeon ? 'text-yellow-300' : 'text-slate-400 dark:text-slate-400'"
            />
          </button>
          <button
            v-for="color in colors"
            :key="color"
            class="size-6 rounded-full border-2 transition-all sm:size-7"
            :class="
              selectedColor === color && !isEraser
                ? 'scale-110 border-slate-700 dark:border-white'
                : 'border-slate-300 dark:border-slate-500'
            "
            :style="{
              backgroundColor: color,
              boxShadow: isNeon ? `0 0 8px 2px ${color}` : 'none',
            }"
            @click="setColor(color, $event)"
          />
        </div>

        <!-- Sizes + tools -->
        <div class="flex items-center gap-1.5">
          <UButton
            v-for="size in brushSizes"
            :key="size.value"
            :variant="selectedSize === size.value ? 'solid' : 'ghost'"
            :color="selectedSize === size.value ? 'primary' : 'neutral'"
            size="xs"
            @click="setSize(size.value)"
          >
            {{ size.label }}
          </UButton>

          <div class="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-600" />

          <UButton
            :variant="isRainbow ? 'solid' : 'ghost'"
            :color="isRainbow ? 'primary' : 'neutral'"
            icon="i-lucide-rainbow"
            size="xs"
            @click="toggleRainbow"
          />
          <UButton
            :variant="isBlink ? 'solid' : 'ghost'"
            :color="isBlink ? 'primary' : 'neutral'"
            icon="i-lucide-sparkles"
            size="xs"
            @click="toggleBlink"
          />

          <div class="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-600" />

          <UButton
            :variant="isEraser ? 'solid' : 'ghost'"
            :color="isEraser ? 'primary' : 'neutral'"
            icon="i-lucide-eraser"
            size="xs"
            @click="toggleEraser"
          />
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-undo-2"
            size="xs"
            @click="canvasComponent?.undo()"
          />
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-trash-2"
            size="xs"
            @click="clearWithWipe"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { animate } from "animejs";

const canvasComponent = ref<{
  undo: () => void;
  clear: () => void;
  exportImage: () => string | null;
  brushColor: string;
  brushSize: number;
  blinkMode: boolean;
  setBlinkMode: (enabled: boolean) => void;
  rainbowMode: boolean;
  neonGlow: boolean;
} | null>(null);

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
const isNeon = ref(false);
const colors = computed(() => (isNeon.value ? neonColors : normalColors));
const brushSizes = [
  { label: "S", value: 12 },
  { label: "M", value: 24 },
  { label: "L", value: 48 },
];

const wipeRef = ref<HTMLElement | null>(null);

const selectedColor = ref("#22c55e");
const selectedSize = ref(24);
const isEraser = ref(false);
const isBlink = ref(false);
const isRainbow = ref(false);
const previousColor = ref("#000000");
const colorMode = useColorMode();
const eraserColor = computed(() =>
  colorMode.value === "dark" ? "#1e293b" : "#ffffff",
);

function toggleNeon() {
  isNeon.value = !isNeon.value;
  if (canvasComponent.value) canvasComponent.value.neonGlow = isNeon.value;
  // Switch to the corresponding color in the new palette
  const fromPalette = isNeon.value ? normalColors : neonColors;
  const toPalette = isNeon.value ? neonColors : normalColors;
  const idx = fromPalette.indexOf(selectedColor.value);
  const newColor = idx >= 0 ? toPalette[idx]! : toPalette[0]!;
  selectedColor.value = newColor;
  if (canvasComponent.value && !isEraser.value) {
    canvasComponent.value.brushColor = newColor;
  }
}

const { playClick } = useSoundEffects();

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
  // Bounce the clicked button
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
  // Disable rainbow and blink when entering eraser
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
    }
  } else {
    disableEraser();
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
