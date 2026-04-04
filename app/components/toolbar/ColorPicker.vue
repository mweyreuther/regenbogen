<template>
  <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
    <button
      class="flex size-7 items-center justify-center rounded-full border-2 transition-transform sm:size-8"
      :class="
        isNeon
          ? 'border-slate-700 bg-slate-900 dark:border-white'
          : 'border-slate-300 bg-slate-100 dark:border-slate-500 dark:bg-slate-700'
      "
      @click="$emit('toggle-neon')"
    >
      <UIcon
        name="i-lucide-zap"
        class="size-3.5 sm:size-4"
        :class="
          isNeon ? 'text-yellow-300' : 'text-slate-400 dark:text-slate-400'
        "
      />
    </button>
    <button
      v-for="color in colors"
      :key="color"
      class="size-7 rounded-full border-2 transition-all sm:size-8"
      :class="
        selectedColor === color && !isEraser
          ? 'scale-110 border-slate-700 dark:border-white'
          : 'border-slate-300 dark:border-slate-500'
      "
      :style="{
        backgroundColor: color,
        boxShadow: isNeon ? `0 0 8px 2px ${color}` : 'none',
      }"
      @click="$emit('select', color, $event)"
    />
    <button
      ref="triggerRef"
      class="flex size-7 items-center justify-center rounded-full border-2 border-slate-300 bg-linear-to-br from-red-400 via-green-400 to-blue-400 transition-all sm:size-8 dark:border-slate-500"
      @click="pickerOpen = !pickerOpen"
    >
      <UIcon
        name="i-lucide-pipette"
        class="size-3.5 text-white drop-shadow sm:size-4"
      />
    </button>

    <Teleport to="body">
      <div
        v-show="pickerOpen"
        class="fixed inset-0 z-50"
        @click.self="pickerOpen = false"
      >
        <div
          ref="panelRef"
          class="fixed z-50 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-600 dark:bg-slate-800"
          :style="panelStyle"
        >
          <UColorPicker
            :model-value="selectedColor"
            size="sm"
            @update:model-value="onCustomColor"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  colors: string[];
  selectedColor: string;
  isNeon: boolean;
  isEraser: boolean;
}>();

const emit = defineEmits<{
  select: [color: string, event: MouseEvent];
  "toggle-neon": [];
  custom: [color: string];
}>();

const pickerOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const panelStyle = ref<Record<string, string>>({});

watch(pickerOpen, (open) => {
  if (!open || !triggerRef.value) return;
  nextTick(() => {
    const rect = triggerRef.value!.getBoundingClientRect();
    const panel = panelRef.value;
    const panelH = panel?.offsetHeight ?? 260;
    const gap = 8;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top: number;
    if (spaceAbove >= panelH + gap) {
      top = rect.top - panelH - gap;
    } else if (spaceBelow >= panelH + gap) {
      top = rect.bottom + gap;
    } else {
      top = Math.max(gap, (window.innerHeight - panelH) / 2);
    }

    let left = rect.left + rect.width / 2;
    const panelW = panel?.offsetWidth ?? 200;
    left = Math.max(
      panelW / 2 + gap,
      Math.min(left, window.innerWidth - panelW / 2 - gap),
    );

    panelStyle.value = {
      top: `${top}px`,
      left: `${left}px`,
      transform: "translateX(-50%)",
    };
  });
});

function onCustomColor(v: string | undefined) {
  if (v) emit("custom", v);
}
</script>
