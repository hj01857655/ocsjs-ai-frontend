// 全局消息管理器
import { createApp } from 'vue'
import MessageToast from '@/components/UX/MessageToast.vue'

class MessageManager {
  constructor() {
    this.container = null
    this.messages = []
    this.maxMessages = 5
    this.init()
  }

  init() {
    // 创建消息容器
    this.container = document.createElement('div')
    this.container.className = 'message-container'
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `
    document.body.appendChild(this.container)

    // 响应式适配
    this.setupResponsive()
  }

  setupResponsive() {
    const updatePosition = () => {
      if (window.innerWidth <= 768) {
        this.container.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          right: 10px;
          z-index: 10000;
          pointer-events: none;
        `
      } else {
        this.container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
        `
      }
    }

    window.addEventListener('resize', updatePosition)
    updatePosition()
  }

  show(options) {
    // 限制消息数量
    if (this.messages.length >= this.maxMessages) {
      this.removeOldest()
    }

    const messageId = Date.now() + Math.random()
    const messageElement = document.createElement('div')
    messageElement.style.pointerEvents = 'auto'
    
    const app = createApp(MessageToast, {
      ...options,
      onClose: () => {
        this.remove(messageId)
      }
    })

    app.mount(messageElement)
    this.container.appendChild(messageElement)

    this.messages.push({
      id: messageId,
      element: messageElement,
      app: app
    })

    return messageId
  }

  remove(messageId) {
    const index = this.messages.findIndex(msg => msg.id === messageId)
    if (index > -1) {
      const message = this.messages[index]
      
      // 卸载Vue应用
      message.app.unmount()
      
      // 移除DOM元素
      if (message.element.parentNode) {
        message.element.parentNode.removeChild(message.element)
      }
      
      // 从数组中移除
      this.messages.splice(index, 1)
    }
  }

  removeOldest() {
    if (this.messages.length > 0) {
      this.remove(this.messages[0].id)
    }
  }

  clear() {
    while (this.messages.length > 0) {
      this.removeOldest()
    }
  }

  // 便捷方法
  success(message, options = {}) {
    return this.show({
      type: 'success',
      message,
      title: options.title || '成功',
      ...options
    })
  }

  error(message, options = {}) {
    return this.show({
      type: 'error',
      message,
      title: options.title || '错误',
      duration: options.duration || 5000, // 错误消息显示更久
      ...options
    })
  }

  warning(message, options = {}) {
    return this.show({
      type: 'warning',
      message,
      title: options.title || '警告',
      ...options
    })
  }

  info(message, options = {}) {
    return this.show({
      type: 'info',
      message,
      title: options.title || '提示',
      ...options
    })
  }

  // 特殊类型的消息
  loading(message = '加载中...', options = {}) {
    return this.show({
      type: 'info',
      message,
      title: options.title || '加载',
      duration: 0, // 不自动关闭
      closable: false,
      showProgress: false,
      ...options
    })
  }

  progress(message, progress, options = {}) {
    return this.show({
      type: 'info',
      message: `${message} ${Math.round(progress)}%`,
      title: options.title || '进度',
      duration: 0,
      closable: false,
      showProgress: true,
      ...options
    })
  }

  // API错误处理
  handleApiError(error, defaultMessage = '操作失败') {
    let message = defaultMessage
    let details = ''
    let title = '错误'

    if (error.response) {
      const data = error.response.data
      
      if (data && data.message) {
        message = data.message
      }
      
      if (data && data.error_category) {
        title = `${title} (${data.error_category})`
      }
      
      if (data && data.details) {
        details = typeof data.details === 'string' 
          ? data.details 
          : JSON.stringify(data.details)
      }
      
      // 根据HTTP状态码调整显示时间
      const duration = error.response.status >= 500 ? 8000 : 5000
      
      return this.error(message, {
        title,
        details,
        duration
      })
    } else if (error.request) {
      return this.error('网络连接失败，请检查网络设置', {
        title: '网络错误',
        details: '无法连接到服务器',
        duration: 6000
      })
    } else {
      return this.error(message, {
        title: '未知错误',
        details: error.message,
        duration: 5000
      })
    }
  }

  // 操作确认
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      // 这里可以集成确认对话框组件
      // 暂时使用浏览器原生确认框
      const result = window.confirm(message)
      resolve(result)
    })
  }
}

// 创建全局实例
const messageManager = new MessageManager()

// 导出便捷方法
export const $message = {
  success: (message, options) => messageManager.success(message, options),
  error: (message, options) => messageManager.error(message, options),
  warning: (message, options) => messageManager.warning(message, options),
  info: (message, options) => messageManager.info(message, options),
  loading: (message, options) => messageManager.loading(message, options),
  progress: (message, progress, options) => messageManager.progress(message, progress, options),
  remove: (id) => messageManager.remove(id),
  clear: () => messageManager.clear(),
  handleApiError: (error, defaultMessage) => messageManager.handleApiError(error, defaultMessage),
  confirm: (message, options) => messageManager.confirm(message, options)
}

// Vue 3 插件
export default {
  install(app) {
    app.config.globalProperties.$message = $message
    app.provide('$message', $message)
  }
}

// 导出管理器实例
export { messageManager }
