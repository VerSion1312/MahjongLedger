<template>
  <div 
    class="player-avatar"
    :class="{ 'large': size === 'large', 'medium': size === 'medium', 'small': size === 'small' }"
    :style="{ backgroundColor: color }"
  >
    <span v-if="name" class="avatar-text">{{ name.charAt(0) }}</span>
    <el-icon v-else class="avatar-icon"><User /></el-icon>
  </div>
</template>

<script>
import { User } from '@element-plus/icons-vue'

export default {
  name: 'PlayerAvatar',
  components: {
    User
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'medium'
    },
    color: {
      type: String,
      default: ''
    }
  },
  computed: {
    avatarColor() {
      if (this.color) return this.color
      
      // 根据名字生成颜色
      const colors = [
        '#409EFF', // 蓝色
        '#67C23A', // 绿色  
        '#E6A23C', // 黄色
        '#F56C6C', // 红色
        '#909399', // 灰色
        '#B37FEB', // 紫色
        '#FF85C0', // 粉色
        '#20B2AA'  // 青色
      ]
      
      if (!this.name) return colors[0]
      
      let hash = 0
      for (let i = 0; i < this.name.length; i++) {
        hash = this.name.charCodeAt(i) + ((hash << 5) - hash)
      }
      return colors[Math.abs(hash) % colors.length]
    }
  }
}
</script>

<style scoped>
.player-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  background-color: v-bind(avatarColor);
}

.player-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

.player-avatar.medium {
  width: 48px;
  height: 48px;
  font-size: 16px;
}

.player-avatar.large {
  width: 64px;
  height: 64px;
  font-size: 20px;
}

.avatar-text {
  font-size: inherit;
  font-weight: bold;
}

.avatar-icon {
  font-size: 50%;
}
</style> 