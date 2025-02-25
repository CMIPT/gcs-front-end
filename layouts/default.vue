<script setup lang="ts">
const userAuth = useUserAuth();
</script>
<template>
  <a-layout>
    <a-layout-header class="py-4 px-6 items-center">
      <a-row justify="space-between">
        <a-col flex="none">
          <GCSBand />
        </a-col>
        <a-col flex="none" v-if="!userAuth?.accessToken">
          <GCSLoginAndSignup />
        </a-col>
        <a-col flex="none" v-else>
          <GCSUser />
        </a-col>
      </a-row>
    </a-layout-header>

    <a-layout-content :style="{ width: '90%' }">
      <slot />
    </a-layout-content>

    <GCSFooter />
  </a-layout>
</template>
