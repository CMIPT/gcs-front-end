<script setup>
import { APIPaths } from "~/utils";

definePageMeta({
  layout: "login",
});

const loginWidth = "300px";

const router = useRouter();

const userAuth = useState("userAuth");

const userForm = reactive({
  name: "",
  password: "",
});

const handleLogin = async () => {
  const config = useRuntimeConfig();
  try {
    Message.loading("正在登录...");
    const apiURL =
      config.public.apiBaseURL + APIPaths.AUTHENTICATION_SIGN_IN_API_PATH;
    await $fetch(apiURL, {
      method: "POST",
      body: JSON.stringify({
        username: userForm.name,
        userPassword: userForm.password,
      }),
      onResponse({ _, response }) {
        Message.clear();
        if (response.status === HTTPStatusCode.OK) {
          userAuth.value = {
            "access-token": response.headers.get("access-token"),
            "refresh-token": response.headers.get("refresh-token"),
          };
          Message.success("登录成功，跳转到主页");
          router.push("/");
        } else if (response.status === HTTPStatusCode.BAD_REQUEST) {
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
    <div class="border border-slate-200 rounded-lg shadow-lg mx-auto px-6">
      <ATypographyTitle class="text-center">登录</ATypographyTitle>
      <AForm
        :model="userForm"
        :style="{ width: loginWidth }"
        layout="vertical"
        @submit="handleLogin"
      >
        <AFormItem field="name" label="用户名">
          <AInput v-model="userForm.name" />
        </AFormItem>
        <AFormItem field="password" label="密码">
          <AInput v-model="userForm.password" type="password" />
        </AFormItem>
        <AFormItem>
          <AButton class="ml-auto" html-type="submit">登录</AButton>
        </AFormItem>
      </AForm>
    </div>
  </div>
</template>
