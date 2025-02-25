<script setup lang="ts">
const signinWidth = "300px";
const router = useRouter();
const loading = ref(false);

type SigninForm = {
  usernameOrEmail: string;
  password: string;
};

const form = reactive<SigninForm>({
  usernameOrEmail: "",
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
  loading.value = true;
  if (!(await loginAndRedirect(form.usernameOrEmail, form.password, null))) {
    loading.value = false;
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
      <a-form-item field="usernameOrEmail" label="用户名/邮箱">
        <a-input v-model="form.usernameOrEmail" />
      </a-form-item>
      <a-form-item field="password" label="密码">
        <a-input-password v-model="form.password" />
      </a-form-item>
      <a-form-item>
        <NuxtLink to="/reset-password">
          <a-button class="ml-auto"> 忘记密码？ </a-button>
        </NuxtLink>
        <a-button
          type="primary"
          class="ml-auto"
          html-type="submit"
          :loading="loading"
        >
          登录</a-button
        >
      </a-form-item>
    </a-form>
  </div>
</template>
