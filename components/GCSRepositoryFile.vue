<script setup lang="ts">
const props = defineProps({
  filename: String,
  content: String,
  language: String,
});
const plain: Record<string, string> = {
  txt: "plaintext",
  LICENSE: "plaintext",
  gitignore: "plaintext",
  env: "plaintext",
  markdown: "markdown",
  md: "markdown",
};
const isPlain = () => {
  const ext = (props.filename || "").split(".").pop() || "";
  if (plain[ext]) {
    return true;
  }
  return false;
};
// TODO: line number, diff, etc.
</script>
<template>
  <pre v-if="isPlain()">{{ content }}</pre>
  <ClientOnly v-else>
    <highlightjs autodetect :code="content ? content : ''" />
  </ClientOnly>
</template>
