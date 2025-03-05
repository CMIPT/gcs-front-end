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
};
const getLanguage = () => {
  const ext = (props.filename || "").split(".").pop() || "";
  if (extToLanguage[ext]) {
    return extToLanguage[ext];
  }
  return "";
};
const result = ref<string>("");
const getContent = () => {
  const language = props.language || getLanguage();
  if (language !== "markdown" && language !== "") {
    result.value = "```" + language + "\n" + props.content + "\n```";
  } else if (language === "markdown") {
    result.value = props.content || "";
  } else {
    result.value = (props.content || "").replace(/\n/g, "<br>");
  }
  return result.value;
};
// TODO: line number, diff, etc.
</script>
<template>
  <a-typography v-if="getLanguage() === '' || getLanguage() == 'markdown'">
    <pre v-html="getContent()" />
  </a-typography>
  <MDC :value="getContent()" v-else />
</template>
