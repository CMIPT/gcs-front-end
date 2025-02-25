<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps({
  error: Object as () => NuxtError,
});
</script>

<template>
  <NuxtLayout name="default">
    <div
      class="flex-col flex items-center border border-slate-200 rounded-lg shadow-lg mx-auto p-8"
    >
      <a-typography-title class="text-center">
        {{ error?.statusCode }}
      </a-typography-title>
      <a-typography-text>
        {{ error?.message }}
      </a-typography-text>
    </div>
  </NuxtLayout>
</template>
