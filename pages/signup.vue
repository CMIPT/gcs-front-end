<script setup lang="ts">
import { type FormInstance, type FieldRule } from "@arco-design/web-vue";

const formRef = ref<FormInstance>();

const signupWidth = "400px";

const router = useRouter();

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
  verificationCode: boolean;
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
  verificationCode: false,
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
      const password = value || "";
      const apiURL = new URL(
        APIPaths.USER_CHECK_USER_PASSWORD_VALIDITY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("userPassword", password);
      await $fetch(apiURL.toString())
        .then(() => {
          formState.password = true;
          cb();
          if (form.confirmPassword) {
            formRef.value?.validateField("confirmPassword");
          }
        })
        .catch((error) => {
          formState.password = false;
          const message = error.data["message"];
          cb(message);
        });
    },
  },
];

const confirmPasswordRules: FieldRule[] = [
  {
    validator: (value, cb) => {
      if (value && form.password && value !== form.password) {
        formState.confirmPassword = false;
        cb("两次输入密码不一致");
        return;
      }
      formState.confirmPassword = true;
      cb();
    },
  },
];

const emailRules: FieldRule[] = [
  {
    validator: async (value, cb) => {
      const email = value ? value : "";
      const apiURL = new URL(
        APIPaths.USER_CHECK_EMAIL_VALIDITY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("email", email);
      await $fetch(apiURL.toString())
        .then(() => {
          formState.email = true;
          cb();
        })
        .catch((error) => {
          formState.email = false;
          const message = error.data["message"];
          cb(message);
        });
    },
  },
];

const verificationCodeRules: FieldRule[] = [
  {
    validator: (value, cb) => {
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

const isFormValid = computed(() => {
  return (
    formState.username &&
    formState.password &&
    formState.confirmPassword &&
    formState.email &&
    formState.verificationCode
  );
});

const handleGetVerificationCode = () => {
  formState.canResendCode = false;
  Message.loading("正在发送验证码...");
  const apiURL = new URL(
    APIPaths.AUTHENTICATION_SEND_EMAIL_VERIFICATION_CODE_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("email", form.email);
  $fetch(apiURL.toString())
    .then(() => {
      Message.clear();
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
};
const handleSignup = () => {
  Message.loading("正在注册...");
  const apiURL = new URL(
    APIPaths.AUTHENTICATION_SIGN_UP_API_PATH,
    window.origin,
  );
  $fetch(apiURL.toString(), {
    method: "POST",
    body: JSON.stringify({
      username: form.username,
      userPassword: form.password,
      email: form.email,
      emailVerificationCode: form.verificationCode,
    }),
  })
    .then(() => {
      Message.clear();
      Message.success("注册成功，跳转到登录页面");
      router.push("/login");
    })
    .catch((error) => {
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
      <a-form-item field="username" label="用户名" validate-trigger="blur">
        <a-input v-model="form.username" placeholder="请输入用户名" />
      </a-form-item>
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
        <a-input v-model="form.verificationCode" :max-length="6" />
        <a-button
          type="primary"
          :disabled="!formState.canResendCode || !formState.email"
          @click="handleGetVerificationCode"
        >
          {{
            formState.resendCodeCountdown > 0
              ? `${formState.resendCodeCountdown}秒后重试`
              : "获取验证码"
          }}
        </a-button>
      </a-form-item>
      <a-form-item>
        <a-button class="ml-auto" html-type="submit" :disabled="!isFormValid">
          注册
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
