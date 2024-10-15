<script setup>
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
        await $fetch(
          `${config.public.apiBaseURL}/gcs/user/username?username=${username}`
        );
        cb();
      } catch (error) {
        cb("用户名已被注册");
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
        await $fetch(
          `${config.public.apiBaseURL}/gcs/user/email?email=${email}`
        );
        cb();
      } catch (error) {
        cb("邮箱已被注册");
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

const handleSignup = async () => {
  const config = useRuntimeConfig();
  try {
    Message.loading("正在注册...");
    await $fetch(`${config.public.apiBaseURL}/gcs/auth/signup`, {
      method: "POST",
      body: JSON.stringify({
        username: userForm.name,
        userPassword: userForm.password,
        email: userForm.email,
      }),
      onResponse({ _, response }) {
        Message.clear();
        if (response.status === 200) {
          Message.success("注册成功，跳转到登录页面");
          router.push("/login");
        } else if (response.status === 400) {
          const code = response._data["code"];
          if (code === 7) {
            Message.error("密码长度必须在6和20之间");
          }
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
        @submit="handleSignup"
      >
        <AFormItem field="name" label="用户名" :rules="nameRules">
          <AInput v-model="userForm.name" validate-trigger="blur" />
        </AFormItem>
        <AFormItem field="email" label="邮箱" :rules="emailRules">
          <AInput v-model="userForm.email" validate-trigger="blur" />
        </AFormItem>
        <AFormItem field="password" label="密码">
          <AInput v-model="userForm.password" type="password" />
        </AFormItem>
        <AFormItem
          field="confirmPassword"
          label="确认密码"
          :rules="passwordRules"
        >
          <AInput
            v-model="userForm.confirmPassword"
            type="password"
            validate-trigger="blur"
          />
        </AFormItem>
        <AFormItem>
          <AButton class="ml-auto" html-type="submit">登录</AButton>
        </AFormItem>
      </AForm>
    </div>
  </div>
</template>
