<template>
  <UDrawer
    :open="open"
    title="Stempel"
    description="Sticker zum Stempeln wählen"
    @update:open="(v) => emit('update:open', v)"
  >
    <template #content>
      <div
        class="max-h-[70vh] overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-2"
      >
        <ToolbarPanelHeader
          title="Stempel"
          @close="emit('update:open', false)"
        />

        <p class="mb-3 text-sm text-slate-500 dark:text-slate-300">
          Wähle einen Sticker und tippe dann auf die Leinwand.
        </p>

        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="emoji in stamps"
            :key="emoji"
            :aria-label="`Stempel ${emoji}`"
            class="flex aspect-square items-center justify-center rounded-xl border text-3xl transition-colors"
            :class="
              selectedStamp === emoji
                ? 'border-sky-300 bg-sky-50 dark:border-sky-500/50 dark:bg-sky-500/10'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:bg-slate-700'
            "
            @click="pick(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { injectToolbar } from "~/composables/useToolbar";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [boolean] }>();

const { selectedStamp, setStamp } = injectToolbar();

const stamps = [
  // Herzen in allen Farben
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "🩵",
  "💜",
  "🩷",
  "🤍",
  "🩶",
  // Sticker
  "⭐",
  "🌈",
  "🦄",
  "🌸",
  "🌟",
  "🍎",
  "🎈",
  "🦋",
  "🐱",
  "🐶",
  "🐠",
  "🌞",
  "🌙",
  "⚡",
  "🍦",
  "🐞",
  "🦖",
  "🌺",
  "🎉",
];

function pick(emoji: string) {
  setStamp(emoji);
  // Close so the canvas is tappable for stamping.
  emit("update:open", false);
}
</script>
