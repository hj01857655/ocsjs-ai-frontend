import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const sidebar = ref({
    opened: true,
    withoutAnimation: false
  })

  const device = ref('desktop')
  const size = ref('default')
  const theme = ref('light')
  const language = ref('zh-cn')

  const cachedViews = ref([])
  const visitedViews = ref([])
  const breadcrumb = ref([])

  const systemInfo = ref({
    version: '2.0.0',
    buildTime: '',
    environment: 'development'
  })

  // 计算属性
  const sidebarOpened = computed(() => sidebar.value.opened)
  const isMobile = computed(() => device.value === 'mobile')

  // 方法
  const toggleSidebar = () => {
    sidebar.value.opened = !sidebar.value.opened
    sidebar.value.withoutAnimation = false
  }

  const closeSidebar = (withoutAnimation = false) => {
    sidebar.value.opened = false
    sidebar.value.withoutAnimation = withoutAnimation
  }

  const toggleDevice = (deviceType) => {
    device.value = deviceType
  }

  const setSize = (newSize) => {
    size.value = newSize
    localStorage.setItem('app-size', newSize)
  }

  const setTheme = (newTheme) => {
    theme.value = newTheme
    localStorage.setItem('app-theme', newTheme)

    // 切换Element Plus主题
    const html = document.documentElement
    if (newTheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const setLanguage = (lang) => {
    language.value = lang
    localStorage.setItem('app-language', lang)
  }

  const addCachedView = (view) => {
    if (cachedViews.value.includes(view.name)) return
    if (view.meta && view.meta.keepAlive) {
      cachedViews.value.push(view.name)
    }
  }

  const delCachedView = (view) => {
    const index = cachedViews.value.indexOf(view.name)
    if (index > -1) {
      cachedViews.value.splice(index, 1)
    }
  }

  const delAllCachedViews = () => {
    cachedViews.value = []
  }

  const updateBreadcrumb = (route) => {
    try {
      // 如果传入的是字符串路径，则跳过面包屑更新
      if (typeof route === 'string') {
        return
      }

      // 确保route.matched存在且是数组
      if (!route || !route.matched || !Array.isArray(route.matched)) {
        breadcrumb.value = []
        return
      }

      const matched = route.matched.filter(item => item.meta && item.meta.title)
      const breadcrumbList = matched.map(item => ({
        path: item.path,
        title: item.meta.title,
        icon: item.meta.icon
      }))
      breadcrumb.value = breadcrumbList
    } catch (error) {
      console.warn('更新面包屑失败:', error)
      breadcrumb.value = []
    }
  }

  const initApp = async () => {
    // 从localStorage恢复设置
    try {
      const savedSize = localStorage.getItem('app-size')
      if (savedSize) {
        size.value = savedSize
      }

      const savedTheme = localStorage.getItem('app-theme')
      if (savedTheme) {
        setTheme(savedTheme)
      }

      const savedLanguage = localStorage.getItem('app-language')
      if (savedLanguage) {
        language.value = savedLanguage
      }
    } catch (error) {
      console.warn('恢复本地设置失败:', error)
    }

    // 检测设备类型
    try {
      const userAgent = navigator.userAgent
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        device.value = 'mobile'
        sidebar.value.opened = false
      }
    } catch (error) {
      console.warn('设备检测失败:', error)
    }

    // 获取系统信息（可选，失败不影响应用运行）
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

      const response = await fetch('/api/system/info', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        systemInfo.value = { ...systemInfo.value, ...data }
      } else {
        console.warn('系统信息API返回错误状态:', response.status)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('获取系统信息超时')
      } else {
        console.warn('获取系统信息失败:', error.message)
      }
      // 使用默认系统信息
      systemInfo.value = {
        version: '2.0.0',
        buildTime: new Date().toISOString(),
        environment: 'development'
      }
    }
  }

  const initTheme = () => {
    // 初始化主题
    const savedTheme = localStorage.getItem('app-theme') || 'light'
    setTheme(savedTheme)

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = (e) => {
      if (!localStorage.getItem('app-theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleThemeChange)

    // 初始检查
    if (!localStorage.getItem('app-theme')) {
      setTheme(mediaQuery.matches ? 'dark' : 'light')
    }
  }

  const addVisitedView = (view) => {
    if (visitedViews.value.some(v => v.path === view.path)) return
    visitedViews.value.push(
      Object.assign({}, view, {
        title: view.meta.title || 'no-name'
      })
    )
  }

  const addView = (view) => {
    addVisitedView(view)
    addCachedView(view)
  }

  const delVisitedView = (view) => {
    return new Promise(resolve => {
      for (const [i, v] of visitedViews.value.entries()) {
        if (v.path === view.path) {
          visitedViews.value.splice(i, 1)
          break
        }
      }
      resolve([...visitedViews.value])
    })
  }

  const delOthersVisitedViews = (view) => {
    return new Promise(resolve => {
      visitedViews.value = visitedViews.value.filter(v => {
        return v.meta.affix || v.path === view.path
      })
      resolve([...visitedViews.value])
    })
  }

  const delAllVisitedViews = () => {
    return new Promise(resolve => {
      const affixTags = visitedViews.value.filter(tag => tag.meta.affix)
      visitedViews.value = affixTags
      resolve([...visitedViews.value])
    })
  }

  const updateVisitedView = (view) => {
    for (let v of visitedViews.value) {
      if (v.path === view.path) {
        v = Object.assign(v, view)
        break
      }
    }
  }

  const delView = (view) => {
    return new Promise(resolve => {
      delVisitedView(view)
      delCachedView(view)
      resolve({
        visitedViews: [...visitedViews.value],
        cachedViews: [...cachedViews.value]
      })
    })
  }

  const delOthersViews = (view) => {
    return new Promise(resolve => {
      delOthersVisitedViews(view)
      delAllCachedViews()
      resolve({
        visitedViews: [...visitedViews.value],
        cachedViews: [...cachedViews.value]
      })
    })
  }

  const delAllViews = () => {
    return new Promise(resolve => {
      delAllVisitedViews()
      delAllCachedViews()
      resolve({
        visitedViews: [...visitedViews.value],
        cachedViews: [...cachedViews.value]
      })
    })
  }

  const resetApp = () => {
    // 重置应用状态
    sidebar.value = {
      opened: true,
      withoutAnimation: false
    }
    device.value = 'desktop'
    size.value = 'default'
    theme.value = 'light'
    language.value = 'zh-cn'
    cachedViews.value = []
    visitedViews.value = []
    breadcrumb.value = []

    // 清除localStorage
    localStorage.removeItem('app-size')
    localStorage.removeItem('app-theme')
    localStorage.removeItem('app-language')
  }

  return {
    // 状态
    sidebar,
    device,
    size,
    theme,
    language,
    cachedViews,
    visitedViews,
    breadcrumb,
    systemInfo,

    // 计算属性
    sidebarOpened,
    isMobile,

    // 方法
    toggleSidebar,
    closeSidebar,
    toggleDevice,
    setSize,
    setTheme,
    setLanguage,
    addCachedView,
    delCachedView,
    delAllCachedViews,
    addVisitedView,
    addView,
    delVisitedView,
    delOthersVisitedViews,
    delAllVisitedViews,
    updateVisitedView,
    delView,
    delOthersViews,
    delAllViews,
    updateBreadcrumb,
    initApp,
    initTheme,
    resetApp
  }
})
