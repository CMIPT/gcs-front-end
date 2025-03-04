<script setup lang="ts">
const props = defineProps({
  repository: Object as () => RepositoryDetailVO,
});
const repository = props.repository;
</script>
<template>
  <GCSRepository :repository="repository" />
</template>
