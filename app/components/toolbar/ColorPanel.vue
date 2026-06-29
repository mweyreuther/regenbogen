<template>
  <UDrawer
    :open="open"
    title="Farbe"
    description="Farbe, Effekte, Radierer und Hintergrund wählen"
    @update:open="(v) => emit('update:open', v)"
  >
    <template #content>
      <div
        class="max-h-[78vh] overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-2"
      >
        <ToolbarPanelHeader title="Farbe" @close="emit('update:open', false)" />

        <!-- Neon toggle -->
        <button
          class="mb-3 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors"
          :class="
            isNeon
              ? 'border-slate-800 bg-slate-900 dark:border-white'
              : 'border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700'
          "
          @click="toggleNeon()"
        >
          <span
            class="flex items-center gap-2 font-semibold"
            :class="
              isNeon ? 'text-white' : 'text-slate-600 dark:text-slate-200'
            "
          >
            <UIcon
              name="i-lucide-zap"
              class="size-5"
              :class="isNeon ? 'text-yellow-300' : 'text-slate-400'"
            />
            Neon
          </span>
          <span
            class="text-sm font-medium"
            :class="isNeon ? 'text-yellow-300' : 'text-slate-400'"
          >
            {{ isNeon ? "An" : "Aus" }}
          </span>
        </button>

        <!-- Effects -->
        <div class="mb-4 grid grid-cols-2 gap-2.5">
          <ToolbarPanelButton
            icon="i-lucide-rainbow"
            label="Regenbogen"
            :active="isRainbow"
            @click="toggleRainbow()"
          />
          <ToolbarPanelButton
            icon="i-lucide-sparkles"
            label="Blinken"
            :active="isBlink"
            @click="toggleBlink()"
          />
        </div>

        <!-- Swatches + eraser -->
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="(color, i) in colors"
            :key="color"
            :aria-label="colorNames[i] ?? 'Farbe'"
            :aria-pressed="selectedColor === color && !isEraser"
            class="aspect-square w-full rounded-full border-2 transition-all"
            :class="
              selectedColor === color && !isEraser
                ? 'scale-110 border-slate-800 dark:border-white'
                : 'border-slate-200 dark:border-slate-600'
            "
            :style="{
              backgroundColor: color,
              boxShadow: isNeon ? `0 0 10px 2px ${color}` : 'none',
            }"
            @click="setColor(color, $event)"
          />

          <!-- Eraser is just the background color -->
          <button
            aria-label="Radierer"
            :aria-pressed="isEraser"
            class="relative flex aspect-square w-full items-center justify-center rounded-full border-2 transition-all"
            :class="
              isEraser
                ? 'scale-110 border-slate-800 dark:border-white'
                : 'border-dashed border-slate-300 dark:border-slate-500'
            "
            :style="{ backgroundColor: eraserColor }"
            @click="selectEraser()"
          >
            <UIcon
              name="i-lucide-eraser"
              class="size-5 text-slate-400 dark:text-slate-300"
            />
          </button>
        </div>

        <!-- Background fills -->
        <p
          class="mb-2 mt-5 px-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400"
        >
          Hintergrund
        </p>
        <div class="grid grid-cols-3 gap-2.5">
          <ToolbarPanelButton
            icon="i-lucide-grid-3x3"
            label="Muster"
            @click="fillBackground('pattern')"
          />
          <ToolbarPanelButton
            icon="i-lucide-blend"
            label="Verlauf"
            @click="fillBackground('gradient')"
          />
          <ToolbarPanelButton
            icon="i-lucide-dices"
            label="Zufall"
            @click="fillBackground('rainbow')"
          />
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { injectToolbar } from "~/composables/useToolbar";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [boolean] }>();

const {
  colors,
  selectedColor,
  isNeon,
  isEraser,
  eraserColor,
  isRainbow,
  isBlink,
  setColor,
  toggleNeon,
  toggleRainbow,
  toggleBlink,
  toggleEraser,
  fillBackground,
} = injectToolbar();

// Accessible names aligned with the palette order (see useToolbar palettes).
const colorNames = [
  "Weiß",
  "Rot",
  "Orange",
  "Bernstein",
  "Gelb",
  "Limette",
  "Grün",
  "Smaragd",
  "Türkis",
  "Cyan",
  "Blau",
  "Indigo",
  "Violett",
  "Magenta",
  "Pink",
];

function selectEraser() {
  if (!isEraser.value) toggleEraser();
}
</script>
