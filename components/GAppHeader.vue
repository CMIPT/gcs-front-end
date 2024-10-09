<script setup>
const searchBarWidth = 300;
</script>

<template>
    <header class="h-16 flex items-center px-6 border-b border-slate-200">
        <!-- 网页图标 -->
        <NuxtLink to="/">
            <Icon name="fa6-solid:code" />
        </NuxtLink>
        <NuxtLink to="/">
            <button class="px-4">GCS</button>
        </NuxtLink>
        <input type="text" placeholder="搜索" class="px-4 ml-auto" :style="{ maxWidth: searchBarWidth }" />
        <div class="pl-4 flex gap-2 items-center">
            <button>
                登录
            </button>
            <button>
                注册
            </button>
        </div>
    </header>
</template>