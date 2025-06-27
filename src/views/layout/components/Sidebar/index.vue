<template>
  <div class="sidebar-wrapper">
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <!-- Logo区域 -->
      <div class="sidebar-logo-container" :class="{ collapse: !sidebar.opened }">
        <transition name="sidebarLogoFade">
          <router-link v-if="sidebar.opened" key="collapse" class="sidebar-logo-link" to="/">
            <img v-if="logo" :src="logo" class="sidebar-logo" alt="logo">
            <h1 class="sidebar-title">{{ title }}</h1>
          </router-link>
          <router-link v-else key="expand" class="sidebar-logo-link" to="/">
            <img v-if="logo" :src="logo" class="sidebar-logo" alt="logo">
          </router-link>
        </transition>
      </div>

      <!-- 菜单区域 -->
      <el-menu :default-active="activeMenu" :collapse="!sidebar.opened" :background-color="variables.menuBg"
        :text-color="variables.menuText" :unique-opened="false" :active-text-color="variables.menuActiveText"
        :collapse-transition="false" mode="vertical">
        <sidebar-item v-for="route in routes" :key="route.path" :item="route" :base-path="''" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import SidebarItem from './SidebarItem.vue'
import logo from '@/assets/logo.png'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 计算属性
const sidebar = computed(() => appStore.sidebar)
const routes = computed(() => {
  // 直接定义菜单结构，确保菜单能正常显示
  const menuRoutes = [
    {
      path: '/dashboard',
      meta: { title: '仪表盘', icon: 'Dashboard' },
      children: [
        { path: '/dashboard/overview', meta: { title: '概览', icon: 'DataAnalysis' } },
        { path: '/dashboard/realtime', meta: { title: '实时监控', icon: 'Monitor' } }
      ]
    },
    {
      path: '/search',
      meta: { title: '智能搜题', icon: 'Search' },
      children: [
        { path: '/search/ai', meta: { title: 'AI搜题', icon: 'MagicStick' } },
        { path: '/search/batch', meta: { title: '批量搜题', icon: 'Files' } }
      ]
    },
    {
      path: '/questions',
      meta: { title: '题库管理', icon: 'Collection' },
      children: [
        { path: '/questions/list', meta: { title: '题目列表', icon: 'List' } },
        { path: '/questions/import', meta: { title: '题目导入', icon: 'Upload' } },
        { path: '/questions/statistics', meta: { title: '题库统计', icon: 'PieChart' } }
      ]
    },
    {
      path: '/settings',
      meta: { title: '设置', icon: 'Tools' },
      children: [
        { path: '/settings/profile', meta: { title: '个人设置', icon: 'User' } },
        { path: '/settings/preferences', meta: { title: '偏好设置', icon: 'Operation' } }
      ]
    }
  ]

  // 如果用户是 admin，添加系统管理菜单
  if (userStore.userInfo.role === 'admin') {
    menuRoutes.splice(3, 0, {
      path: '/system',
      meta: { title: '系统管理', icon: 'Setting' },
      children: [
        { path: '/system/cache', meta: { title: '缓存管理', icon: 'Coin' } },
        { path: '/system/database', meta: { title: '数据库优化', icon: 'DataBoard' } },
        { path: '/system/proxy', meta: { title: '代理管理', icon: 'Connection' } },
        { path: '/system/logs', meta: { title: '系统日志', icon: 'Document' } }
      ]
    })
  }

  return menuRoutes
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

// 配置
const title = 'EduBrain AI'

// 样式变量
const variables = {
  menuBg: '#304156',
  menuText: '#bfcbd9',
  menuActiveText: '#409eff'
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.sidebar-wrapper {
  width: 100% !important;
  height: 100%;
  position: fixed;
  font-size: 0px;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  background-color: $menuBg;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #2b2f3a;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      margin-right: 12px;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 14px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}

.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.el-menu {
  border: none;
  height: 100%;
  width: 100% !important;
}

// 滚动条样式
:deep(.scrollbar-wrapper) {
  overflow-x: hidden !important;
}

:deep(.el-scrollbar__bar.is-vertical > div) {
  background-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-scrollbar__bar.is-horizontal > div) {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
