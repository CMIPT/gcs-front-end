<script setup>
definePageMeta({
    layout: 'login'
})

const loginWidth = '400px';

const username = ref('')
const userPassword = ref('')

const router = useRouter()

const handleLogin = async () => {
    const config = useRuntimeConfig()
    try {
        await $fetch(`${config.public.apiBaseURL}/gcs/auth/signin`, {
            'method': 'POST',
            'body': JSON.stringify({ username: username.value, userPassword: userPassword.value }),
            onResponse({ _, response }) {
                if (response.status === 200) {
                    localStorage.setItem('Access-Token', response.headers.get('Access-Token'))
                    localStorage.setItem('Refresh-Token', response.headers.get('Refresh-Token'))
                    alert("登录成功，跳转到主页");
                    router.push('/');
                }
                else if (response.status === 400) {
                    alert('登录失败，请确认用户名和密码');
                }
            }
        })
    } catch (e) {
        console.error(e)
    }
}

const inputPasswordRef = ref(null);
const handlePasswordFocus = () => {
    inputPasswordRef.value?.focus()
}
</script>

<template>
    <div class="flex flex-col justify-center h-screen">
        <div class="border border-slate-200 rounded-lg shadow-lg mx-auto flex flex-col gap-2 px-6 py-10"
            :style="{ width: loginWidth }">
            <h1 class="text-2xl text-center pb-4">登录</h1>
            <span>用户名</span>
            <GInput type="text" v-model:model-value="username" @keyup.enter="handlePasswordFocus" />
            <span>密码</span>
            <GInput type="password" v-model:model-value="userPassword" @keyup.enter="handleLogin"
                ref="inputPasswordRef" />
            <GButton class="ml-auto mt-4" @click="handleLogin">登录</GButton>
        </div>
    </div>
</template>