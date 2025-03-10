<script setup lang="ts">
import { type FormInstance, type FieldRule } from "@arco-design/web-vue";

const formRef = ref<FormInstance>();
const signupLoading = ref<boolean>(false);
const sendCodeLoading = ref<boolean>(false);

const signupWidth = "400px";

type SignUpForm = {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  verificationCode: string;
};

type SignupFormState = {
  username: boolean;
  password: boolean;
  confirmPassword: boolean;
  email: boolean;
  canResendCode: boolean;
  resendCodeCountdown: number;
};

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
  canResendCode: true,
  resendCodeCountdown: 0,
});

const usernameRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const username = value || "";
      const apiURL = new URL(
        APIPaths.USER_CHECK_USERNAME_VALIDITY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("username", username);
      await $fetch(apiURL.toString())
        .then(() => {
          formState.username = true;
          cb();
        })
        .catch((error) => {
          formState.username = false;
          const message = error.data["message"];
          cb(message);
        });
    },
  },
];

const passwordRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      formState.password = await passwordValidator(value, cb);
      if (formState.password && form.confirmPassword) {
        formRef.value?.validateField("confirmPassword");
      }
    },
  },
];

const confirmPasswordRules: FieldRule[] = [
  {
    validator: (value, cb) => {
      formState.confirmPassword = confirmPasswordValidator(value, form, cb);
    },
  },
];

const emailRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      formState.email = await emailValidator(value, cb);
    },
  },
];

const formRules = {
  username: usernameRules,
  password: passwordRules,
  confirmPassword: confirmPasswordRules,
  email: emailRules,
};

const isFormValid = computed(() => {
  return Object.values(formState).every((state) => state);
});

const handleGetVerificationCode = async () => {
  if (!formState.email) {
    await formRef.value?.validateField("email");
    if (!formState.email) {
      return;
    }
  }
  sendCodeLoading.value = true;
  formState.canResendCode = false;
  const apiURL = new URL(
    APIPaths.AUTHENTICATION_SEND_EMAIL_VERIFICATION_CODE_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("email", form.email);
  await $fetch(apiURL.toString())
    .then(() => {
      Message.success("验证码发送成功");
      formState.resendCodeCountdown = 60;
      const timer = setInterval(() => {
        formState.resendCodeCountdown--;
        if (formState.resendCodeCountdown-- <= 0) {
          formState.canResendCode = true;
          clearInterval(timer);
        }
      }, 1000);
    })
    .catch((error) => {
      const message = error.data["message"];
      Message.error(message);
    });
  sendCodeLoading.value = false;
};

const handleSignup = async () => {
  signupLoading.value = true;
  if (!isFormValid.value) {
    await formRef.value?.validate();
    if (!isFormValid.value) {
      signupLoading.value = false;
      return;
    }
  }
  const apiURL = new URL(APIPaths.USER_CREATE_USER_API_PATH, window.origin);
  await $fetch(apiURL.toString(), {
    method: "POST",
    body: JSON.stringify({
      username: form.username,
      userPassword: form.password,
      email: form.email,
      emailVerificationCode: form.verificationCode,
    }),
  })
    .then(async () => {
      Message.success("注册成功，登录中……");
      await loginAndRedirect(form.username, form.password, "/login");
    })
    .catch((error) => {
      signupLoading.value = false;
      const message = error.data["message"];
      Message.error(message);
    });
};
</script>

<template>
  <div
    class="flex-col flex items-center border border-slate-200 rounded-lg shadow-lg mx-auto p-8"
  >
    <a-typography-title class="text-center">注册</a-typography-title>
    <a-form
      :model="form"
      :rules="formRules"
      :style="{ width: signupWidth }"
      layout="vertical"
      ref="formRef"
      @submit-success="handleSignup"
    >
      <a-form-item field="username" label="用户名">
        <a-input v-model="form.username" placeholder="请输入用户名" />
      </a-form-item>
      <a-form-item field="password" label="密码">
        <a-input-password v-model="form.password" placeholder="请输入密码" />
      </a-form-item>
      <a-form-item field="confirmPassword" label="确认密码">
        <a-input-password
          v-model="form.confirmPassword"
          placeholder="请再一次确认密码"
        />
      </a-form-item>
      <a-form-item field="email" label="邮箱">
        <a-input v-model="form.email" placeholder="请输入邮箱" />
      </a-form-item>
      <a-form-item field="verificationCode" label="验证码">
        <a-verification-code
          v-model="form.verificationCode"
          style="width: 200px"
          :formatter="
            (inputValue) => (/^\d*$/.test(inputValue) ? inputValue : false)
          "
          @finish="handleSignup"
        />
        <a-button
          type="primary"
          class="ml-auto"
          :disabled="!formState.canResendCode"
          @click="handleGetVerificationCode"
          :loading="sendCodeLoading"
        >
          {{
            formState.resendCodeCountdown > 0
              ? `${formState.resendCodeCountdown}秒后重试`
              : "获取验证码"
          }}
        </a-button>
      </a-form-item>
      <a-form-item>
        <a-button
          type="primary"
          class="ml-auto"
          html-type="submit"
          :loading="signupLoading"
        >
          注册
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
