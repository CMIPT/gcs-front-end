<script setup>
const userAuth = useState("userAuth");

const fetchUserInfo = async () => {
  // 没有登录信息需要用户手动登录
  if (!userAuth.value) {
    return false;
  }

  try {
    const config = useRuntimeConfig();
    const accessToken = userAuth.value["access-token"];
    const { data } = await $fetch(`${config.public.apiBaseURL}/gcs/user/get`, {
      headers: {
        "Access-Token": accessToken,
      },
    });
    console.log(data);
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
};

const fetchUserRepo = async () => {};

const fetchHomeData = async () => {
  if (await fetchUserInfo()) {
    fetchUserRepo();
  }
};
fetchHomeData();
</script>

<template>
  <div class="flex justify-center pt-4 px-6">Hello World!</div>
</template>
