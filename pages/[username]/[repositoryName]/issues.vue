<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const props = defineProps<{
  repository: RepositoryDetailVO;
}>();

onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
});
</script>

<template>
  <div class="issues-layout">
    <NuxtPage :repository="repository" />
  </div>
</template>

<style scoped>
.issues-layout {
  width: 100%;
}
</style> 