<template>
  <div class="flex items-center gap-1.5 mobile-landscape:flex-col">
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-lucide-download"
      size="xs"
      @click="$emit('save')"
    />
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-lucide-share"
      size="xs"
      @click="$emit('share')"
    />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  save: [];
  share: [];
}>();
</script>
