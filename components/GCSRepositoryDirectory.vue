<script setup lang="ts">
const props = defineProps({
  prefix: String,
  directoryList: Array as () => RepositoryFileVO[],
});
const directoryList = props.directoryList?.sort((a, b) => {
  if (a.isDirectory && !b.isDirectory) {
    return -1;
  }
  if (!a.isDirectory && b.isDirectory) {
    return 1;
  }
  return a.name.localeCompare(b.name);
});
</script>
<template>
  <a-list class="my-2">
    <a-list-item v-for="item in directoryList" :key="item.name">
      <a-row justify="space-between">
        <a-col :span="4">
          <NuxtLink :to="prefix + '/' + item.name">
            <a-typography-text>
              <icon-folder v-if="item.isDirectory" />
              <icon-file v-else />
              {{ item.name }}
            </a-typography-text>
          </NuxtLink>
        </a-col>
        <!-- TODO: finish this next verion -->
        <a-col :span="4">
          <a-typography-text> Initial commit </a-typography-text>
        </a-col>
        <a-col flex="none">
          <a-typography-text> 2 hours ago </a-typography-text>
        </a-col>
      </a-row>
    </a-list-item>
  </a-list>
</template>
