<script setup>
const props = defineProps({
  modelValue: "",
});

const emit = defineEmits(["update:modelValue"]);

const updateValue = (event) => {
  const newValue = event.target.value;
  emit("update:modelValue", newValue);
};

const inputRef = ref(null);
const focus = () => {
  inputRef.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <input
    type="text"
    class="border border-slate-200 rounded-sm h-8 px-2"
    :value="modelValue"
    @input="updateValue"
    ref="inputRef"
  />
</template>
