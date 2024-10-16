<script setup>
import { APIPaths } from "~/utils";

definePageMeta({
  layout: "login",
});

const signupWidth = "400px";

const router = useRouter();

const userForm = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const nameRules = [
  {
    validator: async (value, cb) => {
      const config = useRuntimeConfig();
      try {
        const username = value ? value : "";
        const apiURL = new URL(
          APIPaths.USER_CHECK_USERNAME_VALIDITY_API_PATH,
          config.public.apiBaseURL
        );
        apiURL.searchParams.append("username", username);
        await $fetch(apiURL);
        cb();
      } catch (error) {
        console.error(error);
        const message = error.response._data["message"];
        cb(message);
      }
    },
  },
];

const emailRules = [
  {
    validator: async (value, cb) => {
      const config = useRuntimeConfig();
      try {
        const email = value ? value : "";
        const apiURL = new URL(
          APIPaths.USER_CHECK_EMAIL_VALIDITY_API_PATH,
          config.public.apiBaseURL
        );
        apiURL.searchParams.append("email", email);
        await $fetch(apiURL);
        cb();
      } catch (error) {
        console.error(error);
        const message = error.response._data["message"];
        cb(message);
      }
    },
  },
];

const passwordRules = [
  {
    validator: (value, cb) => {
      if (userForm.password !== value) {
        cb("两次输入密码不一致");
      } else {
        cb();
      }
    },
  },
];

const userFormRules = {
  name: nameRules,
  email: emailRules,
  password: passwordRules,
  confirmPassword: passwordRules,
};

const handleSignup = async () => {
  const config = useRuntimeConfig();
  try {
    Message.loading("正在注册...");
    const apiURL = new URL(
      APIPaths.AUTHENTICATION_SIGN_UP_API_PATH,
      config.public.apiBaseURL
    );
    await $fetch(apiURL, {
      method: "POST",
      body: JSON.stringify({
        username: userForm.name,
        userPassword: userForm.password,
        email: userForm.email,
      }),
      onResponse({ _, response }) {
        Message.clear();
        if (response.status === HTTPStatusCode.OK) {
          Message.success("注册成功，跳转到登录页面");
          router.push("/login");
        } else {
          const message = response._data["message"];
          Message.error(message);
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
      <ATypographyTitle class="text-center">注册</ATypographyTitle>
      <AForm
        :model="userForm"
        :style="{ width: signupWidth }"
        layout="vertical"
        @submit-success="handleSignup"
        :rules="userFormRules"
      >
        <AFormItem field="name" label="用户名">
          <AInput v-model="userForm.name" validate-trigger="blur" />
        </AFormItem>
        <AFormItem field="email" label="邮箱">
          <AInput v-model="userForm.email" validate-trigger="blur" />
        </AFormItem>
        <AFormItem field="password" label="密码">
          <AInput v-model="userForm.password" type="password" />
        </AFormItem>
        <AFormItem field="confirmPassword" label="确认密码">
          <AInput
            v-model="userForm.confirmPassword"
            type="password"
            validate-trigger="blur"
          />
        </AFormItem>
        <AFormItem>
          <AButton class="ml-auto" html-type="submit">注册</AButton>
        </AFormItem>
      </AForm>
    </div>
  </div>
</template>
