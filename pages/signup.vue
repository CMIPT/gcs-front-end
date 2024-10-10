<script setup>
definePageMeta({
    layout: 'login'
})

const signupWidth = '400px';

const username = ref('')
const userPassword = ref('')
const email = ref('')
const userPasswordConfirm = ref('')

const router = useRouter()

const handleSignup = async () => {
    if (userPassword.value !== userPasswordConfirm.value) {
        alert('两次密码输入不一致，请重新确认');
        return;
    }
    const config = useRuntimeConfig()
    await $fetch(`${config.public.apiBaseURL}/gcs/auth/signup`, {
        'method': 'POST',
        'body': JSON.stringify({ username: username.value, userPassword: userPassword.value, email: email.value }),
        onResponse({ _, response }) {
            if (response.status === 200) {
                alert('注册成功，跳转到登录页面');
                router.push('/login');
            }
            if (response.status === 400) {
                alert('注册失败，请检查用户名和密码');
            }
        },
    })
}
</script>

<template>
    <div class="flex flex-col justify-center h-screen">
        <div class="border border-slate-200 rounded-lg shadow-lg mx-auto flex flex-col gap-2 px-6 py-10"
            :style="{ width: signupWidth }">
            <h1 class="text-2xl text-center pb-4">注册</h1>
            <span>用户名</span>
            <GInput type="text" v-model:model-value="username" />
            <span>邮箱</span>
            <GInput type="text" v-model:model-value="email" />
            <span>密码</span>
            <GInput type="password" v-model:model-value="userPassword" />
            <span>请确认密码</span>
            <GInput type="password" v-model:model-value="userPasswordConfirm" />
            <GButton class="ml-auto mt-4" @click="handleSignup">注册</GButton>
        </div>
    </div>
</template>