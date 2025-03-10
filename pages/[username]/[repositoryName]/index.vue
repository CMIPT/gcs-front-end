<script setup lang="ts">
defineProps<{
  repository: RepositoryDetailVO;
}>();
</script>
<template>
  <GCSRepository :repository="repository" />
</template>
