<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isLandscape"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-white/95 px-8 text-center backdrop-blur-md dark:bg-slate-900/95"
    >
      <UIcon
        name="i-lucide-smartphone"
        class="size-16 text-slate-700 dark:text-slate-200"
      />
      <p
        class="max-w-xs text-pretty text-xl font-bold leading-relaxed text-slate-800 dark:text-slate-100"
      >
        Bitte dreh dein Gerät ins Hochformat
      </p>
      <p class="text-3xl">📱</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
// Best-effort portrait lock: the manifest handles installed PWAs, this overlay
// covers the case the manifest can't (notably iOS Safari) by blocking the UI
// whenever a phone is held in landscape.
const isLandscape = useMediaQuery(
  "(orientation: landscape) and (max-height: 500px)",
);
</script>
