<script setup lang="ts">
const route = useRoute();
const selectedMenu = ref<string>(route.path.split("/")[4] || "settings");
const props = defineProps(["repository"]);
const repository = props.repository as RepositoryVO;
const userInfo = useUserInfo();
const pageFound = ref<boolean>();
onMounted(async () => {
  if (repository.userId !== userInfo.value.id) {
    tryThrowAndShowError(
      {
        response: {
          status: HTTPStatus.NOT_FOUND,
        },
      },
      "页面未找到",
    );
  }
  pageFound.value = true;
});
</script>
<template>
  <a-layout-sider :width="350" v-if="pageFound">
    <a-menu :default-selected-keys="[selectedMenu]">
      <NuxtLink :to="`/${repository?.username}/${repository?.repositoryName}/settings`">
        <a-menu-item key="settings">
          <template #icon><icon-settings /></template>
          设置
        </a-menu-item>
      </NuxtLink>
      <NuxtLink :to="`/${repository?.username}/${repository?.repositoryName}/settings/collaborators`">
        <a-menu-item key="collaborators">
          <template #icon><icon-user-group /></template>
          合作者
        </a-menu-item>
      </NuxtLink>
    </a-menu>
  </a-layout-sider>
  <a-layout-content>
    <NuxtPage :repository="repository"/>
  </a-layout-content>
</template>
