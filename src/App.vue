<template>
  <div id="app" class="app-container">
    <el-config-provider :locale="locale" :size="globalSize">
      <!-- 全局加载条 -->
      <div v-if="loading" v-loading="loading" class="global-loading" element-loading-text="加载中..."
        element-loading-spinner="el-icon-loading" element-loading-background="rgba(0, 0, 0, 0.8)">
      </div>

      <!-- 主路由视图 -->
      <router-view v-slot="{ Component, route }">
        <transition name="fade-transform" mode="out-in">
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>

      <!-- 全局通知容器 -->
      <el-backtop :right="40" :bottom="40" />

      <!-- 全局网络状态监控 -->
      <NetworkStatus />
    </el-config-provider>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import NetworkStatus from '@/components/Global/NetworkStatus.vue'

// 路由和状态管理
const $route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const locale = ref(zhCn)

// 计算属性
const globalSize = computed(() => appStore.size)
const cachedViews = computed(() => appStore.cachedViews)

// 生命周期
onMounted(async () => {
  try {
    loading.value = true

    // 初始化主题（优先执行）
    appStore.initTheme()

    // 初始化应用配置（忽略API错误）
    try {
      await appStore.initApp()
    } catch (error) {
      console.warn('获取系统信息失败，使用默认配置:', error)
    }

    // 检查用户登录状态
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        console.warn('获取用户信息失败:', error)
      }
    }

  } catch (error) {
    console.error('应用初始化失败:', error)
    ElMessage.error('应用初始化失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
})

// 监听路由变化
watch(() => $route, async (newRoute) => {
  // 等待DOM更新完成
  await nextTick()

  // 更新面包屑
  try {
    if (appStore.updateBreadcrumb && newRoute) {
      appStore.updateBreadcrumb(newRoute)
    }
  } catch (error) {
    console.warn('更新面包屑失败:', error)
  }
}, { immediate: false, flush: 'post' })
</script>

<style lang="scss">
.app-container {
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  overflow-y: auto;
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

// 路由过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

// 全局滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--el-bg-color-page);
}

::-webkit-scrollbar-thumb {
  background: var(--el-border-color-light);
  border-radius: 3px;

  &:hover {
    background: var(--el-border-color);
  }
}

// 响应式布局
@media (max-width: 768px) {
  .app-container {
    font-size: 14px;
  }
}
</style>
