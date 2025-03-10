<script setup lang="ts">
const props = defineProps<{
  filename: string;
  content: string;
  language?: string;
}>();
const ext = props.filename.split(".").pop() || "";

const ext2Language: Record<string, string> = {
  awk: "awk",
  bash: "bash",
  c: "c",
  cc: "cpp",
  cpp: "cpp",
  cs: "csharp",
  cxx: "cpp",
  css: "css",
  dockerfile: "dockerfile",
  go: "go",
  h: "cpp",
  hpp: "cpp",
  java: "java",
  Dockerfile: "dockerfile",
  js: "javascript",
  json: "json",
  lua: "lua",
  py: "python",
  sh: "shell",
  sql: "sql",
  ts: "typescript",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
};

const language = props.language || ext2Language[ext] || undefined;
const plain: Record<string, string> = {
  txt: "plaintext",
  LICENSE: "plaintext",
  gitignore: "plaintext",
  env: "plaintext",
  markdown: "markdown",
  md: "markdown",
};

// TODO: line number, diff, etc.
</script>
<template>
  <pre v-if="plain[ext]">{{ content }}</pre>
  <ClientOnly v-else-if="language">
    <highlightjs :language="language" :code="content" />
  </ClientOnly>
  <div v-else>UNSUPPORTED YET</div>
</template>
