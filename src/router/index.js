import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { getToken, isLoggedIn } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { createRouter, createWebHistory } from 'vue-router'

// 配置NProgress
NProgress.configure({
  showSpinner: false,
  minimum: 0.2,
  easing: 'ease',
  speed: 500
})

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
      hideInMenu: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/dashboard/overview',
    meta: {
      title: '仪表盘',
      icon: 'Dashboard',
      requiresAuth: true
    },
    children: [
      {
        path: 'overview',
        name: 'DashboardOverview',
        component: () => import('@/views/dashboard/Overview.vue'),
        meta: {
          title: '概览',
          icon: 'DataAnalysis',
          requiresAuth: true
        }
      },
      {
        path: 'realtime',
        name: 'DashboardRealtime',
        component: () => import('@/views/dashboard/Realtime.vue'),
        meta: {
          title: '实时监控',
          icon: 'Monitor',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/search/ai',
    meta: {
      title: '智能搜题',
      icon: 'Search',
      requiresAuth: true
    },
    children: [
      {
        path: 'ai',
        name: 'AISearch',
        component: () => import('@/views/search/AISearch.vue'),
        meta: {
          title: 'AI搜题',
          icon: 'MagicStick',
          requiresAuth: true
        }
      },
      {
        path: 'batch',
        name: 'BatchSearch',
        component: () => import('@/views/search/BatchSearch.vue'),
        meta: {
          title: '批量搜题',
          icon: 'Files',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/questions',
    name: 'Questions',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/questions/list',
    meta: {
      title: '题库管理',
      icon: 'Collection',
      requiresAuth: true
    },
    children: [
      {
        path: 'list',
        name: 'QuestionsList',
        component: () => import('@/views/questions/List.vue'),
        meta: {
          title: '题目列表',
          icon: 'List',
          requiresAuth: true
        }
      },
      {
        path: 'import',
        name: 'QuestionsImport',
        component: () => import('@/views/questions/Import.vue'),
        meta: {
          title: '题目导入',
          icon: 'Upload',
          requiresAuth: true
        }
      },
      {
        path: 'statistics',
        name: 'QuestionsStatistics',
        component: () => import('@/views/questions/Statistics.vue'),
        meta: {
          title: '题库统计',
          icon: 'PieChart',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/system',
    name: 'System',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/system/cache',
    meta: {
      title: '系统管理',
      icon: 'Setting',
      requiresAuth: true,
      roles: ['admin']
    },
    children: [
      {
        path: 'cache',
        name: 'SystemCache',
        component: () => import('@/views/system/Cache.vue'),
        meta: {
          title: '缓存管理',
          icon: 'Coin',
          requiresAuth: true
        }
      },
      {
        path: 'database',
        name: 'SystemDatabase',
        component: () => import('@/views/system/Database.vue'),
        meta: {
          title: '数据库优化',
          icon: 'DataBoard',
          requiresAuth: true
        }
      },
      {
        path: 'proxy',
        name: 'SystemProxy',
        component: () => import('@/views/system/ApiProxy.vue'),
        meta: {
          title: 'API代理管理',
          icon: 'Connection',
          requiresAuth: true
        }
      },
      {
        path: 'logs',
        name: 'SystemLogs',
        component: () => import('@/views/system/Logs.vue'),
        meta: {
          title: '系统日志',
          icon: 'Document',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/settings/profile',
    meta: {
      title: '设置',
      icon: 'Tools',
      requiresAuth: true
    },
    children: [
      {
        path: 'profile',
        name: 'SettingsProfile',
        component: () => import('@/views/settings/Profile.vue'),
        meta: {
          title: '个人设置',
          icon: 'User',
          requiresAuth: true
        }
      },
      {
        path: 'preferences',
        name: 'SettingsPreferences',
        component: () => import('@/views/settings/Preferences.vue'),
        meta: {
          title: '偏好设置',
          icon: 'Operation',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在',
      hideInMenu: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()
  const appStore = useAppStore()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - EduBrain AI` : 'EduBrain AI'

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    const token = getToken()

    if (!token || !isLoggedIn()) {
      ElMessage.warning('请先登录')
      next('/login')
      return
    }

    // 检查用户信息
    if (!userStore.userInfo.id) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        ElMessage.warning('请先登录')
        next('/login')
        return
      }
    }

    // 检查角色权限
    if (to.meta.roles && !to.meta.roles.includes(userStore.userInfo.role)) {
      ElMessage.error('权限不足')
      next('/404')
      return
    }
  }

  // 如果已登录用户访问登录页，重定向到首页
  if (to.path === '/login' && isLoggedIn()) {
    next('/dashboard')
    return
  }

  next()
})

router.afterEach((to) => {
  NProgress.done()

  // 更新面包屑
  const appStore = useAppStore()
  appStore.updateBreadcrumb(to)
})

export default router
