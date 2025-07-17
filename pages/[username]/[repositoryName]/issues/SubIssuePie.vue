<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  subIssues?: any[]
  total?: number
  completed?: number
}

const props = withDefaults(defineProps<Props>(), {
  subIssues: () => [],
  total: 0,
  completed: 0
})

const completedCount = computed(() => {
  if (props.total !== undefined && props.completed !== undefined) {
    return props.completed
  }
  return props.subIssues.filter(s => s.isClosed).length
})

const totalCount = computed(() => {
  if (props.total !== undefined) {
    return props.total
  }
  return props.subIssues.length
})

const percent = computed(() => totalCount.value > 0 ? completedCount.value / totalCount.value : 0)
const r = 10
const c = 2 * Math.PI * r
const offset = computed(() => c * (1 - percent.value))
</script>

<template>
  <svg width="24" height="24" viewBox="0 0 24 24" style="vertical-align: middle;">
    <!-- 背景圆环 -->
    <circle
      :r="r"
      cx="12"
      cy="12"
      fill="none"
      stroke="#d0d7de"
      stroke-width="4"
    />
    <!-- 进度圆环 -->
    <circle
      :r="r"
      cx="12"
      cy="12"
      fill="none"
      stroke="#52c41a"
      stroke-width="4"
      stroke-linecap="round"
      :stroke-dasharray="c"
      :stroke-dashoffset="offset"
      transform="rotate(-90 12 12)"
    />
  </svg>
</template> 