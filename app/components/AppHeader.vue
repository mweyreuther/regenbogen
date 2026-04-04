<template>
  <header
    class="flex h-16 shrink-0 items-center justify-center border-b border-slate-200/80 bg-white/80 px-5 backdrop-blur-md mobile-landscape:h-auto mobile-landscape:w-16 mobile-landscape:flex-col mobile-landscape:border-b-0 mobile-landscape:border-r mobile-landscape:px-0 mobile-landscape:py-5 dark:border-slate-700/80 dark:bg-slate-800/80"
  >
    <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
      <div
        class="order-1 mobile-landscape:order-1 flex items-center gap-1.5 mobile-landscape:flex-col"
      >
        <AppMenu @save="$emit('save')" @share="$emit('share')" />
      </div>
      <div
        class="order-2 mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:order-2 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600"
      />
      <div
        class="order-3 mobile-landscape:order-3 flex items-center gap-1.5 mobile-landscape:flex-col"
      >
        <ToolbarBrushSizeSelector
          :sizes="sizes"
          :selected-size="selectedSize"
          @select="$emit('select-size', $event)"
        />
      </div>
      <div
        class="order-4 mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:order-4 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600"
      />
      <div
        class="order-5 mobile-landscape:order-5 flex items-center gap-1.5 mobile-landscape:flex-col"
      >
        <ToolbarBrushEffects
          :is-rainbow="isRainbow"
          :is-blink="isBlink"
          @toggle-rainbow="$emit('toggle-rainbow')"
          @toggle-blink="$emit('toggle-blink')"
        />
      </div>
      <div
        class="order-6 mx-0.5 h-5 w-px bg-slate-200 mobile-landscape:order-6 mobile-landscape:mx-0 mobile-landscape:my-0.5 mobile-landscape:h-px mobile-landscape:w-5 dark:bg-slate-600"
      />
      <div
        class="order-7 mobile-landscape:order-7 flex items-center gap-1.5 mobile-landscape:flex-col"
      >
        <ToolbarEditActions
          :is-eraser="isEraser"
          @toggle-eraser="$emit('toggle-eraser')"
          @undo="$emit('undo')"
          @clear="$emit('clear')"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  sizes: Array<{ label: string; value: number }>;
  selectedSize: number;
  isRainbow: boolean;
  isBlink: boolean;
  isEraser: boolean;
}>();

defineEmits<{
  save: [];
  share: [];
  "select-size": [size: number];
  "toggle-rainbow": [];
  "toggle-blink": [];
  "toggle-eraser": [];
  undo: [];
  clear: [];
}>();
</script>
