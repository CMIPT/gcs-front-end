<template>
  <div class="user-card" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" ref="userCardRef">
    <div class="user-display">
      <img :src="user.avatarUrl || '/default-avatar.png'" :alt="user.username" class="user-avatar-small" />
      <span class="username" @click="goToUserHome">{{ user.username }}</span>
    </div>
    
    <!-- 悬停卡片 - 使用Teleport渲染到body -->
    <Teleport to="body">
      <div v-if="showCard" class="user-hover-card" :style="cardPosition" @mouseenter="handleCardMouseEnter" @mouseleave="handleCardMouseLeave">
        <div class="user-info">
          <div class="user-avatar">
            <img :src="user.avatarUrl || '/default-avatar.png'" :alt="user.username" />
          </div>
          <div class="user-details">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
        </div>
        <div class="user-actions">
          <a-button type="primary" size="small" @click="goToUserHome">
            查看主页
          </a-button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { UserVO } from '~/utils/responseVOTypes';

interface Props {
  user: UserVO;
}

const props = defineProps<Props>();
const router = useRouter();
const showCard = ref(false);
const userCardRef = ref<HTMLElement>();
const hideTimeout = ref<number | null>(null);
const isOverCard = ref(false);

const goToUserHome = () => {
  router.push({ path: `/${props.user.username}` });
};

// 鼠标进入用户卡片
const handleMouseEnter = () => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
  showCard.value = true;
  isOverCard.value = false;
};

// 鼠标离开用户卡片
const handleMouseLeave = () => {
  if (!isOverCard.value) {
    hideTimeout.value = window.setTimeout(() => {
      showCard.value = false;
    }, 150); // 150ms延迟，给用户时间移动到卡片
  }
};

// 鼠标进入悬停卡片
const handleCardMouseEnter = () => {
  if (hideTimeout.value) {
    window.clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
  isOverCard.value = true;
};

// 鼠标离开悬停卡片
const handleCardMouseLeave = () => {
  isOverCard.value = false;
  hideTimeout.value = window.setTimeout(() => {
    showCard.value = false;
  }, 150); // 150ms延迟
};

// 计算卡片位置，确保在窗口边界内显示
const cardPosition = computed(() => {
  if (!userCardRef.value) return {};
  
  const rect = userCardRef.value.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const cardWidth = 200; // 卡片宽度
  const cardHeight = 120; // 卡片高度
  
  let left = rect.left;
  let top = rect.bottom + 8; // 距离元素底部8px
  
  // 检查右侧空间
  if (left + cardWidth > windowWidth) {
    left = windowWidth - cardWidth - 10; // 留10px边距
  }
  
  // 检查底部空间
  if (top + cardHeight > windowHeight) {
    top = rect.top - cardHeight - 8; // 显示在元素上方
  }
  
  // 确保不会超出左边界
  if (left < 10) {
    left = 10;
  }
  
  // 确保不会超出上边界
  if (top < 10) {
    top = 10;
  }
  
  return {
    position: 'fixed' as const,
    top: top + 'px',
    left: left + 'px',
    zIndex: 9999
  };
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (hideTimeout.value) {
    window.clearTimeout(hideTimeout.value);
  }
});
</script>

<style scoped>
.user-card {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.user-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
}

.user-avatar-small {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  vertical-align: middle;
}

.username {
  cursor: pointer;
  color: #0969da;
  text-decoration: none;
  vertical-align: middle;
  line-height: 1.4;
  font-size: inherit;
}

.username:hover {
  text-decoration: underline;
}

.user-hover-card {
  background: white;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
  padding: 16px;
  min-width: 200px;
  pointer-events: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #24292f;
  margin-bottom: 4px;
}

.user-email {
  font-size: 12px;
  color: #656d76;
}

.user-actions {
  display: flex;
  justify-content: flex-end;
}
</style> 