<script setup lang="ts">
import { reactive } from "vue"

const signupWidth = '400px';

type SignUpForm = {
  username: string,
  password: string,
  confirmPassword: string,
  email: string,
  verificationCode: string,
}

const form = reactive<SignUpForm>({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  verificationCode: "",
});

const handleSubmit = () => {

}

</script>

<template>
  <div class="flex flex-col justify-center h-screen">
    <a-typography-title class="text-center">注册</a-typography-title>
    <div class="border border-slate-200 rounded-lg shadow-lg mx-auto p-8">
      <a-form :model="form" :style="{ width: signupWidth }" layout="vertical" @submit="handleSubmit">
        <a-form-item field="username" label="用户名">
          <a-input v-model="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item field="password" label="密码">
          <a-input v-model="form.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item field="confirmPassword" label="确认密码">
          <a-input v-model="form.confirmPassword" placeholder="请再一次确认密码" />
        </a-form-item>
        <a-form-item field="email" label="邮箱">
          <a-input v-model="form.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item field="verificationCode" label="验证码">
          <a-input v-model="form.verificationCode" max-length="6" />
          <a-button type="primary">获取验证码</a-button>
        </a-form-item>
        <a-form-item>
          <a-button html-type="submit">注册</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
