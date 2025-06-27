<template>
  <div class="navbar">
    <!-- 左侧区域 -->
    <div class="navbar-left">
      <!-- 折叠按钮 -->
      <hamburger
        id="hamburger-container"
        :is-active="sidebar.opened"
        class="hamburger-container"
        @toggleClick="toggleSideBar"
      />

      <!-- 面包屑 -->
      <breadcrumb id="breadcrumb-container" class="breadcrumb-container" />
    </div>

    <!-- 右侧区域 -->
    <div class="navbar-right">
      <!-- 搜索框 -->
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索题目..."
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearSearch"
          style="width: 200px"
        />
      </div>

      <!-- 全屏按钮 -->
      <screenfull id="screenfull" class="right-menu-item hover-effect" />

      <!-- 主题切换 -->
      <theme-picker class="right-menu-item hover-effect" />

      <!-- 消息通知 -->
      <el-dropdown class="notification-container right-menu-item hover-effect" trigger="click">
        <div class="notification-trigger">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <el-icon><Bell /></el-icon>
          </el-badge>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="notification-dropdown">
            <div class="notification-header">
              <span>通知消息</span>
              <el-button link size="small" @click="markAllAsRead">全部已读</el-button>
            </div>
            <el-scrollbar max-height="300px">
              <div v-if="notifications.length === 0" class="no-notifications">
                暂无通知
              </div>
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification-item"
                :class="{ unread: !notification.read }"
                @click="handleNotificationClick(notification)"
              >
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-desc">{{ notification.description }}</div>
                  <div class="notification-time">{{ formatTime(notification.time) }}</div>
                </div>
              </div>
            </el-scrollbar>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 用户头像下拉菜单 -->
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar" alt="avatar">
          <el-icon class="caret-down"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/settings/profile">
              <el-dropdown-item>
                <el-icon><User /></el-icon>
                个人中心
              </el-dropdown-item>
            </router-link>
            <router-link to="/settings/preferences">
              <el-dropdown-item>
                <el-icon><Setting /></el-icon>
                系统设置
              </el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Search,
  Bell,
  CaretBottom,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import Hamburger from '@/components/Hamburger/index.vue'
import Breadcrumb from '@/components/Breadcrumb/index.vue'
import Screenfull from '@/components/Screenfull/index.vue'
import ThemePicker from '@/components/ThemePicker/index.vue'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 响应式数据
const searchKeyword = ref('')
const notifications = ref([
  {
    id: 1,
    title: '系统通知',
    description: '欢迎使用EduBrain AI智能题库系统',
    time: Date.now(),
    read: false
  }
])

// 计算属性
const sidebar = computed(() => appStore.sidebar)
const avatar = computed(() => userStore.userInfo.avatar || '/src/assets/default-avatar.png')
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

// 方法
const toggleSideBar = () => {
  appStore.toggleSidebar()
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search/ai',
      query: { q: searchKeyword.value }
    })
  }
}

const handleClearSearch = () => {
  searchKeyword.value = ''
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const handleNotificationClick = (notification) => {
  notification.read = true
  // 可以根据通知类型跳转到相应页面
}

const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await userStore.userLogout()
    router.push('/login')
  } catch {
    // 用户取消
  }
}

// 生命周期
onMounted(() => {
  // 可以在这里获取通知数据
})
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .navbar-left {
    display: flex;
    align-items: center;

    .hamburger-container {
      line-height: 46px;
      height: 100%;
      float: left;
      cursor: pointer;
      transition: background 0.3s;
      -webkit-tap-highlight-color: transparent;

      &:hover {
        background: rgba(0, 0, 0, 0.025);
      }
    }

    .breadcrumb-container {
      margin-left: 16px;
    }
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .search-container {
      margin-right: 8px;
    }

    .notification-container {
      .notification-trigger {
        padding: 8px;
        cursor: pointer;
      }
    }

    .avatar-container {
      .avatar-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .caret-down {
          font-size: 12px;
        }
      }
    }
  }
}

.notification-dropdown {
  width: 350px;

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    font-weight: 500;
  }

  .no-notifications {
    text-align: center;
    padding: 40px 20px;
    color: var(--el-text-color-secondary);
  }

  .notification-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--el-bg-color-page);
    }

    &.unread {
      background-color: var(--el-color-primary-light-9);
      border-left: 3px solid var(--el-color-primary);
    }

    .notification-content {
      .notification-title {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .notification-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 4px;
      }

      .notification-time {
        font-size: 11px;
        color: var(--el-text-color-placeholder);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .navbar {
    padding: 0 10px;

    .navbar-right {
      gap: 8px;

      .search-container {
        display: none;
      }

      .right-menu-item {
        padding: 0 4px;
      }
    }
  }
}
</style>
