<template>
  <UDrawer
    :open="open"
    title="Mehr"
    description="Werkzeuge und App-Optionen"
    @update:open="(v) => emit('update:open', v)"
  >
    <template #content>
      <div
        class="max-h-[75vh] overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-2"
      >
        <ToolbarPanelHeader title="Mehr" @close="emit('update:open', false)" />

        <p
          class="mb-2 mt-1 px-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400"
        >
          Werkzeug
        </p>
        <div class="grid grid-cols-3 gap-2.5">
          <ToolbarPanelButton
            icon="i-lucide-undo-2"
            label="Zurück"
            @click="undo()"
          />
          <ToolbarPanelButton
            icon="i-lucide-redo-2"
            label="Wiederholen"
            @click="redo()"
          />
          <ToolbarPanelButton
            icon="i-lucide-trash-2"
            label="Leeren"
            danger
            @click="onClear()"
          />
        </div>

        <p
          class="mb-2 mt-4 px-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400"
        >
          App
        </p>
        <div class="grid grid-cols-2 gap-2.5">
          <ToolbarPanelButton
            icon="i-lucide-download"
            label="Speichern"
            @click="runAndClose(save)"
          />
          <ToolbarPanelButton
            icon="i-lucide-share"
            label="Teilen"
            @click="runAndClose(share)"
          />
          <ToolbarPanelButton
            icon="i-lucide-refresh-cw"
            label="Neu laden"
            @click="runAndClose(reload)"
          />
          <ToolbarPanelButton
            icon="i-lucide-heart"
            label="Info"
            @click="openAbout()"
          />
        </div>
      </div>
    </template>
  </UDrawer>

  <UModal v-model:open="aboutOpen" title="Info" description="Über Regenbogen">
    <template #content>
      <div
        class="relative flex flex-col items-center gap-4 px-6 py-8 text-center"
      >
        <button
          aria-label="Schließen"
          class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          @click="aboutOpen = false"
        >
          <UIcon name="i-lucide-x" class="size-5" />
        </button>
        <UIcon
          name="i-lucide-rainbow"
          class="size-12 text-slate-600 dark:text-slate-200"
        />
        <h2 class="-mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
          Regenbogen
        </h2>
        <p
          class="max-w-xs text-pretty text-lg leading-relaxed text-slate-600 dark:text-slate-300"
        >
          Diese App wurde mit ganz viel Liebe gemacht von eurem Papa
          <strong>Marcus</strong>
        </p>
        <p class="text-xl text-slate-800 dark:text-slate-100">Wilma & Alva</p>
        <p class="text-3xl">
          <span ref="heartRef" class="inline-block">&#10084;&#65039;</span>
        </p>
        <p class="text-xs text-slate-300 dark:text-slate-600">
          bis zum Mond und zurück
        </p>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { animate } from "animejs";
import { injectToolbar } from "~/composables/useToolbar";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [boolean] }>();

const { undo, redo, clear, save, share, reload } = injectToolbar();

function runAndClose(action: () => void | Promise<void>) {
  emit("update:open", false);
  action();
}

function onClear() {
  emit("update:open", false);
  clear();
}

const aboutOpen = ref(false);
const heartRef = ref<HTMLElement | null>(null);

function openAbout() {
  emit("update:open", false);
  aboutOpen.value = true;
}

watch(aboutOpen, (isOpen) => {
  if (!isOpen) return;
  const tryAnimate = () => {
    if (!heartRef.value) {
      requestAnimationFrame(tryAnimate);
      return;
    }
    animate(heartRef.value, {
      rotate: [0, -15, 15, -15, 15, 0],
      scale: [1, 1.2, 1, 1.2, 1, 1],
      duration: 2000,
      ease: "easeInOutSine",
      loop: true,
    });
  };
  requestAnimationFrame(tryAnimate);
});
</script>
