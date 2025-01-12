<script setup lang="ts">
const signinWidth = "300px";
const router = useRouter();

type SigninForm = {
  username: string;
  password: string;
};

const form = reactive<SigninForm>({
  username: "",
  password: "",
});

const userAuth = useUserAuth();
const userInfo = useUserInfo();

const handleSignin = async () => {
  Message.loading({ id: "sign-in", content: "正在登录..." });
  const apiURL = new URL(
    APIPaths.AUTHENTICATION_SIGN_IN_API_PATH,
    window.origin
  );
  try {
    const resp = await $fetch.raw(apiURL.toString(), {
      method: "POST",
      body: JSON.stringify({
        username: form.username,
        userPassword: form.password,
      }),
    });
    userAuth.value = {
      accessToken: resp.headers.get("access-token") || "",
      refreshToken: resp.headers.get("refresh-token") || "",
    };
    const data = resp._data as UserInfoState;
    userInfo.value = {
      id: data.id,
      username: data.username,
      email: data.email,
    };
    Message.success({ id: "sign-in", content: "登录成功，跳转到主页" });
    router.push("/");
  } catch (error: any) {
    console.error(error);
    const message = error.data["message"];
    Message.error({ id: "sign-in", content: message });
  }
};
</script>

<template>
  <div class="flex flex-col justify-center h-screen">
    <a-typography-title class="text-center">登录</a-typography-title>
    <div class="border border-slate-200 rounded-lg shadow-lg mx-auto p-8">
      <a-form :model="form" :style="{ width: signinWidth }" layout="vertical" @submit="handleSignin">
        <a-form-item field="username" label="用户名">
          <a-input v-model="form.username" />
        </a-form-item>
        <a-form-item field="password" label="密码">
          <a-input-password v-model="form.password" />
        </a-form-item>
        <a-form-item>
          <a-button class="ml-auto" html-type="submit">登录</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
