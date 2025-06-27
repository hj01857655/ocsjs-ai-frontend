import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'default-passive-events'
import App from './App.vue'
import router from './router'
import './styles/index.scss'
import { useUserStore } from './stores/user'
import { getToken } from './utils/auth'

// 导入前端日志收集器
import './utils/logger'

// 导入全局工具
import { createGlobalHealthChecker } from './utils/health'
import { createGlobalErrorHandler } from './utils/errorHandler'

// ECharts
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

// 注册必要的组件
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])



// 创建应用实例
const app = createApp(App)


// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default',
  // 全局配置 Popper.js 选项，优化 getBoundingClientRect 调用
  popperOptions: {
    modifiers: [
      {
        name: 'computeStyles',
        options: {
          gpuAcceleration: false, // 禁用GPU加速，减少getBoundingClientRect错误
          adaptive: false // 禁用自适应定位
        }
      },
      {
        name: 'preventOverflow',
        options: {
          boundary: 'viewport'
        }
      }
    ]
  }
})

// 全局属性
app.config.globalProperties.$ELEMENT = {
  size: 'default',
  zIndex: 3000
}



// 初始化全局服务
const initGlobalServices = () => {
  // 初始化全局错误处理器
  const errorHandler = createGlobalErrorHandler({
    showNotification: true,
    logErrors: true,
    onError: (error, errorInfo, context) => {
      // 可以在这里添加自定义错误处理逻辑
      console.error('Global error:', { error, errorInfo, context })
    }
  })

  // 初始化全局健康检查器
  const healthChecker = createGlobalHealthChecker({
    interval: 30000, // 30秒检查一次
    timeout: 5000,   // 5秒超时
    onStatusChange: (status) => {
      // 网络状态变化时的处理
      if (!status.isHealthy) {
        console.warn('网络连接异常:', status.error)
        // 可以在这里显示全局网络错误提示
      } else {
        console.log('网络连接恢复正常')
      }
    }
  })

  // 启动健康检查
  healthChecker.start()

  console.log('🌐 全局网络监控已启动')
  console.log('🛡️ 全局错误处理器已启动')
}

// 初始化用户信息
const initApp = async () => {
  const userStore = useUserStore()
  const token = getToken()

  if (token) {
    // 如果有token，初始化用户信息
    userStore.initUser()

    // 如果没有用户信息，尝试获取
    if (!userStore.userInfo.id) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        console.warn('初始化用户信息失败:', error)
      }
    }
  }
}

// 挂载应用
app.mount('#app')

// 初始化全局服务
initGlobalServices()

// 初始化应用
initApp()

// 开发环境下的调试信息
if (import.meta.env.DEV) {
  console.log('🚀 EduBrain AI 前端启动成功')
  console.log('📦 Vue版本:', app.version)
  console.log('🎨 Element Plus已加载')
  console.log('🌐 全局网络监控已启用')
}
