<template>
  <UButton
    v-for="size in sizes"
    :key="size.value"
    :variant="selectedSize === size.value ? 'solid' : 'ghost'"
    :color="selectedSize === size.value ? 'primary' : 'neutral'"
    size="xs"
    @click="$emit('select', size.value)"
  >
    {{ size.label }}
  </UButton>
</template>

<script setup lang="ts">
defineProps<{
  sizes: Array<{ label: string; value: number }>;
  selectedSize: number;
}>();

defineEmits<{
  select: [size: number];
}>();
</script>
