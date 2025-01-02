<script setup>
import { APIPaths } from "~/utils";

const searchBarWidth = 300;

const userAuth = useState("userAuth");
const userInfo = useState("userInfo")
const homepageRepositories = useState("homepageRepositories");

const router = useRouter();

const handleNewOption = (v) => {
  if (v == newOptions.newRepository) {
    router.push("/new");
  }
};

const newOptions = {
  newRepository: "新建仓库",
};

const fetchRepositories = async () => {
  const config = useRuntimeConfig();
  const apiURL = new URL(
    APIPaths.USER_PAGE_USER_REPOSITORY_API_PATH,
    config.public.apiBaseURL
  );
  apiURL.searchParams.append("id", userInfo.value.id);
  apiURL.searchParams.append("page", 1);
  apiURL.searchParams.append("size", 10);
  try {
    await $fetch(apiURL, {
      method: "GET",
      headers: {
        "access-token": userAuth.value.accessToken,
      },
      onResponse({ _, response }) {
        homepageRepositories.value = response._data
      },
    });
  } catch (error) {
    console.error("获取仓库数据失败:", error);
  }
};

watch(
  () => userAuth?.value?.accessToken,
  (newToken) => {
    if (newToken) {
      fetchRepositories();
    }
  },
  { immediate: true }
);
const isLoading = ref(false);

const cloneHttps = (url) => {
  navigator.clipboard.writeText(url);
  Message.success(`已复制 HTTPS URL: ${url}`)
};

const cloneSsh = (url) => {
  navigator.clipboard.writeText(url);
  Message.success(`已复制 SSH URL: ${url}`);
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
    <div class="flex gap-4 items-center ml-auto" v-if="userAuth?.accessToken">
      <ADropdown @select="handleNewOption">
        <AButton>
          <template #icon>
            <Icon name="fa6-solid:plus" />
          </template>
        </AButton>
        <template #content>
          <a-doption v-for="key in newOptions" :key="key"> {{ key }} </a-doption>
        </template>
      </ADropdown>
      <!-- TODO: 改为用户信息显示 -->
      <AAvatar>TODO</AAvatar>
    </div>
  </header>
</template>
