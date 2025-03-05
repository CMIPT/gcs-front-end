<script setup lang="ts">
const props = defineProps({
  filename: String,
  content: String,
  language: String,
});
const extToLanguage: Record<string, string> = {
  awk: "awk",
  bash: "bash",
  bat: "bat",
  c: "c",
  cc: "c++",
  cpp: "c++",
  cs: "c#",
  css: "css",
  cxx: "cpp",
  fish: "fish",
  go: "go",
  html: "html",
  java: "java",
  js: "javascript",
  json: "json",
  lua: "lua",
  markdown: "markdown",
  md: "markdown",
  php: "php",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "shell",
  sql: "sql",
  toml: "toml",
  ts: "typescript",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  txt: "plaintext",
  LICENSE: "plaintext",
  gitignore: "plaintext",
  env: "plaintext",
  Dockerfile: "dockerfile",
};
const getLanguage = () => {
  const ext = (props.filename || "").split(".").pop() || "";
  if (extToLanguage[ext]) {
    return extToLanguage[ext];
  }
  return undefined;
};
// TODO: line number, diff, etc.
</script>
<template>
  <a-typography>
    <pre v-html="props.content" v-if="getLanguage()" />
    <pre v-else>UNSUPPORTED</pre>
  </a-typography>
</template>
