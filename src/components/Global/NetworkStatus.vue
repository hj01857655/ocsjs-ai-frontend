<template>
  <div class="network-status" v-if="showStatus">
    <transition name="slide-down">
      <div 
        v-if="!networkStatus.isHealthy" 
        class="network-banner"
        :class="bannerClass"
      >
        <div class="banner-content">
          <el-icon class="banner-icon">
            <Warning v-if="networkStatus.error" />
            <Loading v-else />
          </el-icon>
          <span class="banner-text">{{ statusMessage }}</span>
          <div class="banner-actions">
            <el-button 
              size="small" 
              type="primary" 
              @click="retryConnection"
              :loading="checking"
            >
              重试
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              plain
              @click="hideStatus"
            >
              隐藏
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 网络状态指示器 -->
    <div class="network-indicator" :class="indicatorClass" :title="indicatorTitle">
      <div class="indicator-dot"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Warning, Loading } from '@element-plus/icons-vue'
import { getGlobalHealthChecker } from '@/utils/health'

// 响应式数据
const networkStatus = ref({
  isHealthy: true,
  isConnected: true,
  serverReachable: true,
  latency: null,
  error: null,
  lastCheck: null
})

const showStatus = ref(true)
const checking = ref(false)
const healthChecker = ref(null)

// 计算属性
const bannerClass = computed(() => {
  if (!networkStatus.value.isConnected) {
    return 'banner-error'
  } else if (!networkStatus.value.serverReachable) {
    return 'banner-warning'
  }
  return 'banner-info'
})

const statusMessage = computed(() => {
  if (!networkStatus.value.isConnected) {
    return '网络连接已断开，请检查网络设置'
  } else if (!networkStatus.value.serverReachable) {
    return '服务器连接失败，正在尝试重新连接...'
  } else if (networkStatus.value.error) {
    return `连接异常: ${networkStatus.value.error}`
  }
  return '网络连接正常'
})

const indicatorClass = computed(() => {
  if (!networkStatus.value.isConnected) {
    return 'indicator-offline'
  } else if (!networkStatus.value.serverReachable) {
    return 'indicator-error'
  } else if (networkStatus.value.latency > 1000) {
    return 'indicator-slow'
  } else if (networkStatus.value.latency > 300) {
    return 'indicator-warning'
  }
  return 'indicator-good'
})

const indicatorTitle = computed(() => {
  const latency = networkStatus.value.latency
  const status = networkStatus.value.isHealthy ? '正常' : '异常'
  const latencyText = latency ? `延迟: ${latency}ms` : '未知延迟'
  return `网络状态: ${status} | ${latencyText}`
})

// 方法
const updateNetworkStatus = (status) => {
  networkStatus.value = { ...status }
  
  // 如果网络恢复正常，自动隐藏横幅
  if (status.isHealthy && !showStatus.value) {
    showStatus.value = true
  }
}

const retryConnection = async () => {
  if (!healthChecker.value) return
  
  checking.value = true
  try {
    await healthChecker.value.refresh()
  } catch (error) {
    console.error('重试连接失败:', error)
  } finally {
    checking.value = false
  }
}

const hideStatus = () => {
  showStatus.value = false
  
  // 5分钟后自动显示
  setTimeout(() => {
    if (!networkStatus.value.isHealthy) {
      showStatus.value = true
    }
  }, 5 * 60 * 1000)
}

// 生命周期
onMounted(() => {
  healthChecker.value = getGlobalHealthChecker()
  
  if (healthChecker.value) {
    // 获取当前状态
    const currentStatus = healthChecker.value.getStatus()
    updateNetworkStatus(currentStatus)
    
    // 监听状态变化
    const originalCallback = healthChecker.value.onStatusChange
    healthChecker.value.onStatusChange = (status) => {
      updateNetworkStatus(status)
      if (originalCallback) {
        originalCallback(status)
      }
    }
  }
})

onUnmounted(() => {
  // 清理监听器
  if (healthChecker.value) {
    healthChecker.value.onStatusChange = null
  }
})
</script>

<style lang="scss" scoped>
.network-status {
  position: relative;
  z-index: 9999;
}

.network-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 12px 20px;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &.banner-error {
    background: linear-gradient(135deg, #f56c6c, #e85656);
  }

  &.banner-warning {
    background: linear-gradient(135deg, #e6a23c, #d4941e);
  }

  &.banner-info {
    background: linear-gradient(135deg, #409eff, #337ecc);
  }
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  gap: 12px;
}

.banner-icon {
  font-size: 16px;
  animation: pulse 2s infinite;
}

.banner-text {
  flex: 1;
  text-align: center;
}

.banner-actions {
  display: flex;
  gap: 8px;
}

.network-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.2);
  }

  .indicator-dot {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 50%;
      animation: ripple 2s infinite;
    }
  }

  &.indicator-good .indicator-dot {
    background: #67c23a;
    
    &::after {
      border: 2px solid #67c23a;
    }
  }

  &.indicator-warning .indicator-dot {
    background: #e6a23c;
    
    &::after {
      border: 2px solid #e6a23c;
    }
  }

  &.indicator-slow .indicator-dot {
    background: #f56c6c;
    
    &::after {
      border: 2px solid #f56c6c;
    }
  }

  &.indicator-error .indicator-dot {
    background: #f56c6c;
    animation: blink 1s infinite;
    
    &::after {
      border: 2px solid #f56c6c;
    }
  }

  &.indicator-offline .indicator-dot {
    background: #909399;
    
    &::after {
      border: 2px solid #909399;
    }
  }
}

// 动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes ripple {
  0% {
    opacity: 1;
    transform: scale(0.8);
  }
  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}
</style>
