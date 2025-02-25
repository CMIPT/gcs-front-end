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

const userInfo = useUserInfo();

onMounted(async () => {
  await initialize();
  if (userInfo.value.id) {
    Message.info({ id: "sign-in", content: "你已登录，跳转到主页" });
    router.push("/");
    return;
  }
});

const handleSignin = async () => {
  Message.loading({ id: "sign-in", content: "正在登录..." });
  const apiURL = new URL(
    APIPaths.AUTHENTICATION_SIGN_IN_API_PATH,
    window.origin,
  );
  try {
    const resp = await $fetch.raw(apiURL.toString(), {
      method: "POST",
      body: JSON.stringify({
        username: form.username,
        userPassword: form.password,
      }),
    });
    const accessToken = resp.headers.get("access-token");
    const refreshToken = resp.headers.get("refresh-token");
    if (!accessToken || !refreshToken) {
      throw new Error();
    }
    sessionStorage.setItem("access-token", accessToken);
    localStorage.setItem("refresh-token", refreshToken);
    useUserAuth().value = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    userInfo.value = resp._data as UserVO;
    Message.success({ id: "sign-in", content: "登录成功，正在跳转……" });
    const target = useRedirectAfterLogin().value;
    useRedirectAfterLogin().value = "/";
    router.push(target);
  } catch (error: any) {
    console.error(error);
    if (!error.data) {
      Message.error({ id: "sign-in", content: "登录失败" });
      return;
    }
    const message = error.data["message"];
    Message.error({ id: "sign-in", content: message });
  }
};
</script>

<template>
  <div
    class="flex flex-col items-center border border-slate-200 rounded-lg shadow-lg mx-auto p-8"
  >
    <a-typography-title class="text-center">登录</a-typography-title>
    <a-form
      :model="form"
      :style="{ width: signinWidth }"
      layout="vertical"
      @submit="handleSignin"
    >
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
</template>
