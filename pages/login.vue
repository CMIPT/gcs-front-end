<script setup>
definePageMeta({
  layout: "login",
});

const loginWidth = "400px";

const username = ref("");
const userPassword = ref("");

const router = useRouter();

const userAuth = useState("userAuth");

const handleLogin = async () => {
  const config = useRuntimeConfig();
  try {
    Message.loading("正在登录...");
    await $fetch(`${config.public.apiBaseURL}/gcs/auth/signin`, {
      method: "POST",
      body: JSON.stringify({
        username: username.value,
        userPassword: userPassword.value,
      }),
      onResponse({ _, response }) {
        if (response.status === 200) {
          userAuth.value = {
            "access-token": response.headers.get("access-token"),
            "refresh-token": response.headers.get("refresh-token"),
          };
          Message.success("登录成功，跳转到主页");
          router.push("/");
        } else if (response.status === 400) {
          Message.error("登录失败，请确认用户名和密码");
        }
      },
    });
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <div class="flex flex-col justify-center h-screen">
    <div
      class="border border-slate-200 rounded-lg shadow-lg mx-auto flex flex-col gap-2 px-6 pb-10"
      :style="{ width: loginWidth }"
    >
      <ATypographyTitle class="text-center"> 登录 </ATypographyTitle>
      <ATypographyText>用户名</ATypographyText>
      <AInput type="text" v-model:model-value="username" />
      <ATypographyText>密码</ATypographyText>
      <AInput type="password" v-model:model-value="userPassword" />
      <AButton class="ml-auto mt-4" @click="handleLogin" type="primary">
        登录
      </AButton>
    </div>
  </div>
</template>
