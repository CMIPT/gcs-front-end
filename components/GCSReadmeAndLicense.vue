<script setup ls="ts">
const props = defineProps({
  readmeContent: String,
  licenseContent: String,
});
</script>
<template>
  <a-card v-if="readmeContent || licenseContent">
    <a-tabs>
      <a-tab-pane key="readme" title="README" v-if="readmeContent">
        <GCSRepositoryFile filename="README.md" :content="readmeContent" />
      </a-tab-pane>
      <a-tab-pane key="license" title="LICENSE" v-if="licenseContent">
        <GCSRepositoryFile filename="LICENSE" :content="licenseContent" />
      </a-tab-pane>
    </a-tabs>
  </a-card>
</template>
