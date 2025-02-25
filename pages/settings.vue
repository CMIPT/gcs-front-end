<script setup lang="ts">
const route = useRoute();
const selectedMenu = ref<string>(route.path.split("/")[2] || "settings");
onMounted(() => {
  if (!useUserInfo().value.id) {
    tryThrowAndShowError(
      {
        response: {
          status: HTTPStatus.NOT_FOUND,
        },
      },
      "页面未找到",
    );
  }
});
definePageMeta({ layout: false });
</script>
<template>
  <a-layout>
    <a-layout-header class="py-4 px-6 items-center">
      <a-row justify="space-between">
        <a-col flex="none">
          <GCSBand />
        </a-col>
        <a-col flex="none">
          <GCSUser />
        </a-col>
      </a-row>
    </a-layout-header>

    <a-layout class="settings-detail">
      <a-layout-sider :width="350">
        <a-menu :default-selected-keys="[selectedMenu]">
          <NuxtLink to="/settings">
            <a-menu-item key="settings">
              <template #icon><icon-settings /></template>
              设置
            </a-menu-item>
          </NuxtLink>
          <NuxtLink to="/settings/keys">
            <a-menu-item key="keys">
              <template #icon><icon-lock /></template>
              SSH 公钥
            </a-menu-item>
          </NuxtLink>
        </a-menu>
      </a-layout-sider>
      <a-layout-content>
        <NuxtPage />
      </a-layout-content>
    </a-layout>

    <GCSFooter />
  </a-layout>
</template>

<style scoped>
.settings-detail {
  width: 95%;
  margin: auto;
}
</style>
