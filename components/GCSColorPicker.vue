<template>
  <div class="color-picker">
    <a-popover position="bottom">
      <div class="color-preview" :style="{ backgroundColor: modelValue }"></div>
      <template #content>
        <div class="color-picker-content">
          <!-- 颜色轮盘 -->
          <div class="color-wheel-section">
            <label class="color-wheel-label">选择颜色</label>
            <input 
              v-model="colorWheelValue" 
              type="color" 
              class="color-wheel-input"
              @input="handleColorWheelChange"
            />
          </div>
          
          <!-- 预设颜色 -->
          <div class="preset-colors-section">
            <label class="preset-colors-label">预设颜色</label>
            <div class="color-palette">
              <div
                v-for="color in colors"
                :key="color"
                class="color-option"
                :class="{ 'color-option-selected': color === modelValue }"
                :style="{ backgroundColor: color }"
                @click="handleColorSelect(color)"
              ></div>
            </div>
          </div>
          
          <!-- 自定义颜色输入 -->
          <div class="custom-color-section">
            <label class="custom-color-label">自定义颜色</label>
            <div class="custom-color-input-group">
              <a-input 
                v-model="customColor" 
                placeholder="#RRGGBB" 
                class="custom-color-input"
                @input="handleCustomColorInput"
              />
              <a-button 
                type="primary" 
                size="mini" 
                @click="handleCustomColor"
                :disabled="!isValidColor(customColor)"
              >
                确定
              </a-button>
            </div>
          </div>
        </div>
      </template>
    </a-popover>
    <span class="color-value ml-2">{{ modelValue }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const colors = [
  '#165DFF', '#3491FA', '#8D4EDA', '#F7BA1E',
  '#F53F3F', '#00B42A', '#14C9C9', '#722ED1',
  '#FF7D00', '#9FDB1D', '#FADC19', '#F76965'
]

const customColor = ref('')
const colorWheelValue = ref('')

// 将isValidColor函数移到watch之前
const isValidColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color)
}

// 监听modelValue变化，同步到颜色轮盘
watch(() => props.modelValue, (newValue) => {
  if (newValue && isValidColor(newValue)) {
    colorWheelValue.value = newValue
  }
}, { immediate: true })

const handleColorSelect = (color) => {
  emit('update:modelValue', color)
  colorWheelValue.value = color
  customColor.value = color
}

const handleColorWheelChange = (event) => {
  const color = event.target.value
  emit('update:modelValue', color)
  customColor.value = color
}

const handleCustomColorInput = (value) => {
  // 实时预览自定义颜色
  if (isValidColor(value)) {
    emit('update:modelValue', value)
    colorWheelValue.value = value
  }
}

const handleCustomColor = () => {
  if (isValidColor(customColor.value)) {
    emit('update:modelValue', customColor.value)
    colorWheelValue.value = customColor.value
  }
}
</script>

<style scoped>
.color-picker {
  display: flex;
  align-items: center;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--color-border);
}

.color-picker-content {
  width: 280px;
  padding: 16px;
}

.color-wheel-section {
  margin-bottom: 16px;
}

.color-wheel-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text-1);
}

.color-wheel-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  background: none;
}

.color-wheel-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-wheel-input::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.preset-colors-section {
  margin-bottom: 16px;
}

.preset-colors-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text-1);
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: var(--color-border);
}

.color-option-selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light-1);
}

.custom-color-section {
  margin-bottom: 8px;
}

.custom-color-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text-1);
}

.custom-color-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.custom-color-input {
  flex: 1;
}

.color-value {
  font-size: 12px;
  color: var(--color-text-3);
}
</style> 