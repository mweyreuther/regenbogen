<template>
  <UPopover v-model:open="menuOpen" :dismiss="true">
    <UButton variant="ghost" color="neutral" icon="i-lucide-menu" size="xs" />
    <template #content>
      <div class="flex w-44 flex-col py-1">
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="
            $emit('save');
            menuOpen = false;
          "
        >
          <UIcon name="i-lucide-download" class="size-4" />
          Speichern
        </button>
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="
            $emit('share');
            menuOpen = false;
          "
        >
          <UIcon name="i-lucide-share" class="size-4" />
          Teilen
        </button>
        <div class="my-1 h-px bg-slate-200 dark:bg-slate-600" />
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="
            toggleColorMode();
            menuOpen = false;
          "
        >
          <UIcon
            :name="
              colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'
            "
            class="size-4"
          />
          {{ colorMode.value === "dark" ? "Heller Modus" : "Dunkler Modus" }}
        </button>
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="reloadPage"
        >
          <UIcon name="i-lucide-refresh-cw" class="size-4" />
          Neu laden
        </button>
        <div class="my-1 h-px bg-slate-200 dark:bg-slate-600" />
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="
            menuOpen = false;
            aboutOpen = true;
          "
        >
          <UIcon name="i-lucide-heart" class="size-4" />
          Info
        </button>
      </div>
    </template>
  </UPopover>

  <UModal v-model:open="aboutOpen" title="Info" description="Über Regenbogen">
    <template #content>
      <div
        class="relative flex flex-col items-center gap-4 px-6 py-8 text-center"
      >
        <button
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
        <p class="text-xs text-slate-300 dark:text-slate-600">bis zum Mond und zurück</p>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { animate } from "animejs";

defineEmits<{
  save: [];
  share: [];
}>();

const menuOpen = ref(false);
const aboutOpen = ref(false);
const heartRef = ref<HTMLElement | null>(null);

watch(aboutOpen, (open) => {
  if (!open) return;
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
const colorMode = useColorMode();

function toggleColorMode() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}

function reloadPage() {
  menuOpen.value = false;
  window.location.reload();
}
</script>
