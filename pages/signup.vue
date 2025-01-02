<script setup>
import { APIPaths } from "~/utils";

definePageMeta({
  layout: "login",
});

const signupWidth = "400px";

const router = useRouter();

const userForm = reactive({
  name: "",
  password: "",
  confirmPassword: "",
  email: "",
  emailVerificationCode: "",
});

const formRef = ref(null);

const isNameValid = ref(false);
const isEmailValid = ref(false);
const isEmailVerificationCodeValid = ref(false);
const isPasswordValid = ref(false);
const isConfirmPasswordValid = ref(false);
const isCodeSent = ref(false);
const emailVerificationCodeCountdown = ref(60);
const isFormValid = computed(() => {
  return (
    isNameValid.value &&
    isEmailValid.value &&
    isEmailVerificationCodeValid.value &&
    isPasswordValid.value &&
    isConfirmPasswordValid.value
  );
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
        isNameValid.value = true;
        cb();
      } catch (error) {
        isNameValid.value = false;
        console.error(error);
        const message = error.response._data["message"];
        cb(message);
      }
    },
  },
];

const passwordRules = [
  {
    validator: async (value, cb) => {
      const config = useRuntimeConfig();
      try {
        const password = value ? value : "";
        const apiURL = new URL(
          APIPaths.USER_CHECK_USER_PASSWORD_VALIDITY_API_PATH,
          config.public.apiBaseURL
        );
        apiURL.searchParams.append("userPassword", password);
        await $fetch(apiURL);
        isPasswordValid.value = true;
        cb();
        // The password is updated after inputting the confirm password
        // So we need to validate the confirm password field
        if (isConfirmPasswordValid.value && formRef.value) {
          formRef.value.validateField('confirmPassword');
        }
      } catch (error) {
        isPasswordValid.value = false;
        console.error(error);
        const message = error.response._data["message"];
        cb(message);
      }
    },
  },
];

const confirmPasswordRules = [
  {
    validator: async (value, cb) => {
      if (userForm.password == value) {
        isConfirmPasswordValid.value = true;
        cb();
      } else {
        isConfirmPasswordValid.value = false;
        cb("两次输入密码不一致");
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
        isEmailValid.value = true;
        cb();
      } catch (error) {
        isEmailValid.value = false;
        console.error(error);
        const message = error.response._data["message"];
        cb(message);
      }
    },
  },
];

const emailVerificationCodeRules = [
  {
    validator: async (value, cb) => {
      if (/^\d{6}$/.test(value)) {
        isEmailVerificationCodeValid.value = true;
        cb();
      } else {
        isEmailVerificationCodeValid.value = false;
        cb("请输入6位验证码");
      }
    },
  },
];

const userFormRules = {
  name: nameRules,
  password: passwordRules,
  confirmPassword: confirmPasswordRules,
  email: emailRules,
  emailVerificationCode: emailVerificationCodeRules,
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
        emailVerificationCode: userForm.emailVerificationCode,
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

const handleGetVerificationCode = async () => {
  const config = useRuntimeConfig();
  try {
    Message.loading("正在发送验证码...");
    const apiURL = new URL(
      APIPaths.AUTHENTICATION_SEND_EMAIL_VERIFICATION_CODE_API_PATH,
      config.public.apiBaseURL
    );
    apiURL.searchParams.append("email", userForm.email);
    await $fetch(apiURL, {
      method: "GET",
      onResponse({ _, response }) {
        Message.clear();
        if (response.status === HTTPStatusCode.OK) {
          Message.success("验证码发送成功");
          isCodeSent.value = true;
          emailVerificationCodeCountdown.value = 60;
          const timer = setInterval(() => {
            emailVerificationCodeCountdown.value--;
            if (emailVerificationCodeCountdown.value === 0) {
              isCodeSent.value = false;
              clearInterval(timer);
            }
          },1000);
        } else {
          const message = response._data["message"];
          Message.error(message);
        }
      },
    });
  } catch (e) {
    console.error(e);
    Message.error("验证码发送失败");
  }
};
</script>

<template>
  <div class="flex flex-col justify-center h-screen">
    <div class="border border-slate-200 rounded-lg shadow-lg mx-auto px-6">
      <ATypographyTitle class="text-center">注册</ATypographyTitle>
      <AForm
        ref="formRef"
        :model="userForm"
        :style="{ width: signupWidth }"
        layout="vertical"
        @submit-success="handleSignup"
        :rules="userFormRules"
      >
        <AFormItem field="name" label="用户名">
          <AInput v-model="userForm.name" validate-trigger="blur" />
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
        <AFormItem field="email" label="邮箱">
          <AInput v-model="userForm.email" validate-trigger="blur" />
        </AFormItem>
        <AFormItem field="emailVerificationCode" label="邮箱验证码">
          <div class="flex items-center">
            <AInput
              v-model="userForm.emailVerificationCode"
              validate-trigger="blur"
              :maxlength="6"
              style="width: 80px;"
            />
            <AButton
              class="ml-2"
              :disabled="isCodeSent || !isEmailValid"
              @click="handleGetVerificationCode"
            >
              {{ isCodeSent ? `${countdown}秒后重试` : '获取验证码' }}
            </AButton>
          </div>
        </AFormItem>
        <AFormItem>
          <AButton class="ml-auto" html-type="submit" :disabled="!isFormValid">注册</AButton>
        </AFormItem>
      </AForm>
    </div>
  </div>
</template>
