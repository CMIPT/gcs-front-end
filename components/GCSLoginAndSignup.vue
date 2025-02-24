<template>
  <a-space>
    <NuxtLink to="/login">
      <a-button type="outline" shape="round">
        <!-- TODO: the icon is not shown -->
        <!-- <template #icon><IconLogin /></template> -->
        登录
      </a-button>
    </NuxtLink>
    <NuxtLink to="/signup">
      <a-button type="outline" shape="round">
        <!-- TODO: the icon is not shown -->
        <!-- <template #icon><IconUserPlus /></template> -->
        注册
      </a-button>
    </NuxtLink>
  </a-space>
</template>
