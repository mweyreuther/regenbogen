<template>
  <div class="flex h-dvh flex-col bg-white dark:bg-slate-800">
    <header
      class="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-800/80"
    >
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-palette"
          class="size-7 text-slate-600 dark:text-slate-200"
        />
        <span class="text-lg font-bold text-slate-700 dark:text-slate-100"
          >Regenbogen</span
        >
      </div>
      <button class="flex items-center justify-center" @click="toggleColorMode">
        <UIcon
          :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          class="size-5 text-slate-400 dark:text-slate-300"
        />
      </button>
    </header>

    <main class="flex min-h-0 flex-1 flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

function toggleColorMode() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>
