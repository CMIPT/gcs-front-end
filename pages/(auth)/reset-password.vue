<script setup lang="ts">
import { type FormInstance, type FieldRule } from "@arco-design/web-vue";
const resetPasswordWidth = "400px";

const formRef = ref<FormInstance>();
const resetLoading = ref<boolean>(false);
const sendCodeLoading = ref<boolean>(false);

type ResetPasswordForm = {
  email: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
};

type ResetPasswordFormState = {
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  canResendCode: boolean;
  resendCodeCountdown: number;
};

const form = reactive<ResetPasswordForm>({
  email: "",
  password: "",
  confirmPassword: "",
  verificationCode: "",
});

const formState = reactive<ResetPasswordFormState>({
  email: false,
  password: false,
  confirmPassword: false,
  canResendCode: true,
  resendCodeCountdown: 0,
});

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
      formState.email = await emailValidator(value, cb, true);
    },
  },
];

const formRules = {
  password: passwordRules,
  confirmPassword: confirmPasswordRules,
  email: emailRules,
};

const isFormValid = computed(() => {
  return Object.values(formState).every((state) => state);
});

const handleResetPassword = async () => {
  resetLoading.value = true;
  if (!isFormValid.value) {
    await formRef.value?.validate();
    if (!isFormValid.value) {
      resetLoading.value = false;
      return;
    }
  }
  const apiURL = new URL(
    APIPaths.USER_UPDATE_USER_PASSWORD_WITH_EMAIL_VERIFICATION_CODE_API_PATH,
    window.origin,
  );
  await $fetch
    .raw(apiURL.toString(), {
      method: "POST",
      body: JSON.stringify({
        email: form.email,
        newPassword: form.password,
        emailVerificationCode: form.verificationCode,
      }),
    })
    .then(async () => {
      Message.success("密码重置成功，登录中……");
      await loginAndRedirect(form.email, form.password, "/login");
    })
    .catch((error) => {
      resetLoading.value = false;
      const message = error.data["message"];
      Message.error(message);
    });
};

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
</script>
<template>
  <div
    class="flex-col flex items-center border border-slate-200 rounded-lg shadow-lg mx-auto p-8"
  >
    <a-typography-title class="text-center">重置密码</a-typography-title>
    <a-form
      :model="form"
      :rules="formRules"
      :style="{ width: resetPasswordWidth }"
      layout="vertical"
      ref="formRef"
      @submit-success="handleResetPassword"
    >
      <a-form-item field="password" label="密码" validate-trigger="blur">
        <a-input-password v-model="form.password" placeholder="请输入密码" />
      </a-form-item>
      <a-form-item
        field="confirmPassword"
        label="确认密码"
        validate-trigger="blur"
      >
        <a-input-password
          v-model="form.confirmPassword"
          placeholder="请再一次确认密码"
        />
      </a-form-item>
      <a-form-item field="email" label="邮箱" validate-trigger="blur">
        <a-input v-model="form.email" placeholder="请输入邮箱" />
      </a-form-item>
      <a-form-item field="verificationCode" label="验证码">
        <a-verification-code
          v-model="form.verificationCode"
          style="width: 200px"
          :formatter="
            (inputValue) => (/^\d*$/.test(inputValue) ? inputValue : false)
          "
          @finish="handleResetPassword"
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
          :loading="resetLoading"
        >
          重置密码
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
