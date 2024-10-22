<script setup>
const searchBarWidth = 300;

const userAuth = useState("userAuth");

const router = useRouter();

const handleNewOption = (v) => {
  if (v == newOptions.newRepository) {
    router.push("/new");
  }
};

const newOptions = {
  newRepository: "新建仓库",
};
</script>

<template>
  <header class="h-16 flex items-center px-6 border-b border-slate-200">
    <!-- 网页图标 -->
    <NuxtLink to="/">
      <Icon name="fa6-solid:code" />
    </NuxtLink>
    <NuxtLink to="/" class="ml-4"> GCS </NuxtLink>
    <div class="flex gap-2 items-center ml-auto" v-if="!userAuth?.accessToken">
      <NuxtLink to="/login">
        <AButton type="text">登录</AButton>
      </NuxtLink>
      <NuxtLink to="/signup">
        <AButton type="text">注册</AButton>
      </NuxtLink>
    </div>
    <div class="flex gap-4 items-center ml-auto">
      <ADropdown @select="handleNewOption">
        <AButton>
          <template #icon>
            <Icon name="fa6-solid:plus" />
          </template>
        </AButton>
        <template #content>
          <a-doption v-for="value in newOptions"> {{ value }} </a-doption>
        </template>
      </ADropdown>
      <!-- TODO: 改为用户信息显示 -->
      <AAvatar>TODO</AAvatar>
    </div>
  </header>
</template>
