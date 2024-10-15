<script setup>
const props = defineProps({
  onClick: {
    type: Function,
    required: false,
  },
});

const handleClick = () => {
  if (props.onClick) {
    props.onClick();
  }
};
</script>

<template>
  <button class="border border-slate-200 rounded px-4 h-8" @click="handleClick">
    <slot />
  </button>
</template>
