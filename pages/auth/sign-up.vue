<script setup lang="ts">
import type { FieldRule } from "@arco-design/web-vue";
import { reactive } from "vue"

const signupWidth = '400px';

type SignUpForm = {
  username: string,
  password: string,
  confirmPassword: string,
  email: string,
  verificationCode: string,
}

type SignupFormState = {
  username: boolean,
  password: boolean,
  confirmPassword: boolean,
  email: boolean,
  verificationCode: boolean,
}

const form = reactive<SignUpForm>({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  verificationCode: "",
});

const formState = reactive<SignupFormState>({
  username: false,
  password: false,
  confirmPassword: false,
  email: false,
  verificationCode: false,
})

const usernameRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const username = value || "";
      const apiURL = new URL(
        APIPaths.USER_CHECK_USERNAME_VALIDITY_API_PATH,
        window.origin
      );
      apiURL.searchParams.append("username", username);
      const { error } = await useFetch(apiURL.toString());
      if (error.value?.status === HTTPStatusCode.OK) {
        formState.username = true;
        cb();
      } else {
        formState.username = false;
        const message = error.value?.data["message"];
        cb(message)
      }
    },
  },
];

const passwordRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const password = value || "";
      const apiURL = new URL(
        APIPaths.USER_CHECK_USER_PASSWORD_VALIDITY_API_PATH,
        window.origin
      );
      apiURL.searchParams.append("userPassword", password);
      const { error } = await useFetch(apiURL.toString());
      if (error.value?.status === HTTPStatusCode.OK) {
        formState.password = true;
        cb();
      } else {
        formState.password = false;
        const message = error.value?.data["message"];
        cb(message)
      }
    },
  },
];

const confirmPasswordRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      if (form.password === value) {
        formState.confirmPassword = true;
        cb();
      } else {
        formState.confirmPassword = false;
        cb("两次输入密码不一致");
      }
    },
  },
];

const emailRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const email = value ? value : "";
      const apiURL = new URL(
        APIPaths.USER_CHECK_EMAIL_VALIDITY_API_PATH,
        window.origin
      );
      apiURL.searchParams.append("email", email);
      const { error } = await useFetch(apiURL.toString());
      if (error.value?.status === HTTPStatusCode.OK) {
        formState.email = true;
        cb();
      } else {
        formState.email = false;
        const message = error.value?.data["message"];
        cb(message)
      }
    },
  },
];

const verificationCodeRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      if (/^\d{6}$/.test(value)) {
        formState.verificationCode = true;
        cb();
      } else {
        formState.verificationCode = false;
        cb("请输入6位验证码");
      }
    },
  },
];

const formRules = {
  username: usernameRules,
  password: passwordRules,
  confirmPassword: confirmPasswordRules,
  email: emailRules,
  verificationCode: verificationCodeRules,
};

const handleSubmit = () => {

}

</script>

<template>
  <div class="flex flex-col justify-center h-screen">
    <a-typography-title class="text-center">注册</a-typography-title>
    <div class="border border-slate-200 rounded-lg shadow-lg mx-auto p-8">
      <a-form :model="form" :rules="formRules" :style="{ width: signupWidth }" layout="vertical" @submit="handleSubmit">
        <a-form-item field="username" label="用户名" validate-trigger="blur">
          <a-input v-model="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item field="password" label="密码" validate-trigger="blur">
          <a-input v-model="form.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item field="confirmPassword" label="确认密码" validate-trigger="blur">
          <a-input v-model="form.confirmPassword" placeholder="请再一次确认密码" />
        </a-form-item>
        <a-form-item field="email" label="邮箱">
          <a-input v-model="form.email" placeholder="请输入邮箱" validate-trigger="blur" />
        </a-form-item>
        <a-form-item field="verificationCode" label="验证码" validate-trigger="blur">
          <a-input v-model="form.verificationCode" :max-length="6" />
          <a-button type="primary">获取验证码</a-button>
        </a-form-item>
        <a-form-item>
          <a-button html-type="submit">注册</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
