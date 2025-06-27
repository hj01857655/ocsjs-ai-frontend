/**
 * 健康检查工具函数
 * 遵循前端开发规范：统一错误处理、使用统一的API调用方式
 */
import { simpleHealthCheck } from '@/api/health'
import { ErrorClassifier } from '@/utils/errorHandler'

// 健康检查配置常量
const HEALTH_CHECK_CONFIG = {
  TIMEOUT: 5000,
  RETRY_DELAY: 2000,
  MAX_RETRIES: 3
}

/**
 * 检查网络连接状态
 * @returns {Promise<Object>} 连接状态信息
 */
export async function checkNetworkConnection() {
  const result = {
    isConnected: false,
    serverReachable: false,
    latency: null,
    error: null,
    serverInfo: null
  }

  try {
    // 检查基本网络连接
    result.isConnected = navigator.onLine

    if (result.isConnected) {
      // 检查服务器连接和延迟
      const startTime = Date.now()

      try {
        const healthData = await simpleHealthCheck()
        result.latency = Date.now() - startTime
        result.serverReachable = true
        result.serverInfo = healthData

        // 验证健康检查响应的有效性
        if (healthData && healthData.status === 'healthy') {
          // 服务器健康
        } else {
          result.error = '服务器状态异常'
        }
      } catch (error) {
        result.latency = Date.now() - startTime
        result.serverReachable = false

        // 使用统一的错误分类器处理错误
        const errorInfo = ErrorClassifier.classifyHttpError(error)
        result.error = errorInfo.userMessage

        // 开发环境下输出详细错误信息
        if (import.meta.env.DEV) {
          console.error('健康检查失败:', { error, errorInfo })
        }
      }
    } else {
      result.error = '网络连接断开'
    }
  } catch (error) {
    result.error = error.message || '未知错误'
    result.serverReachable = false

    // 开发环境下输出详细错误信息
    if (import.meta.env.DEV) {
      console.error('网络检查异常:', error)
    }
  }

  return result
}

/**
 * 获取连接质量等级
 * @param {number} latency 延迟时间(ms)
 * @returns {Object} 质量信息
 */
export function getConnectionQuality(latency) {
  if (latency === null) {
    return { level: 'unknown', text: '未知', color: '#909399' }
  }

  if (latency < 100) {
    return { level: 'excellent', text: '优秀', color: '#67c23a' }
  } else if (latency < 300) {
    return { level: 'good', text: '良好', color: '#e6a23c' }
  } else if (latency < 1000) {
    return { level: 'poor', text: '较差', color: '#f56c6c' }
  } else {
    return { level: 'bad', text: '很差', color: '#f56c6c' }
  }
}

/**
 * 监听网络状态变化
 * @param {Function} onOnline 网络连接回调
 * @param {Function} onOffline 网络断开回调
 * @returns {Function} 清理函数
 */
export function setupNetworkListeners(onOnline, onOffline) {
  const handleOnline = () => {
    if (typeof onOnline === 'function') {
      onOnline()
    }
  }

  const handleOffline = () => {
    if (typeof onOffline === 'function') {
      onOffline()
    }
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * 健康检查管理器
 */
export class HealthChecker {
  constructor(options = {}) {
    this.interval = options.interval || 30000 // 30秒
    this.timeout = options.timeout || HEALTH_CHECK_CONFIG.TIMEOUT
    this.retryCount = options.retryCount || HEALTH_CHECK_CONFIG.MAX_RETRIES
    this.onStatusChange = options.onStatusChange || null

    this.isRunning = false
    this.currentStatus = {
      isHealthy: false,
      lastCheck: null,
      consecutiveFailures: 0
    }
    this.timer = null
    this.cleanupNetworkListeners = null
  }

  /**
   * 开始健康检查
   */
  start() {
    if (this.isRunning) return

    this.isRunning = true

    // 设置网络监听器
    this.cleanupNetworkListeners = setupNetworkListeners(
      () => this.checkHealth(),
      () => this.handleOffline()
    )

    // 立即执行一次检查
    this.checkHealth()

    // 设置定时检查
    this.timer = setInterval(() => {
      this.checkHealth()
    }, this.interval)
  }

  /**
   * 停止健康检查
   */
  stop() {
    if (!this.isRunning) return

    this.isRunning = false

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    if (this.cleanupNetworkListeners) {
      this.cleanupNetworkListeners()
      this.cleanupNetworkListeners = null
    }
  }

  /**
   * 执行健康检查
   */
  async checkHealth() {
    try {
      const result = await checkNetworkConnection()
      const isHealthy = result.isConnected && result.serverReachable

      // 更新状态
      const previousStatus = this.currentStatus.isHealthy
      this.currentStatus = {
        isHealthy,
        lastCheck: new Date(),
        consecutiveFailures: isHealthy ? 0 : this.currentStatus.consecutiveFailures + 1,
        ...result
      }

      // 如果状态发生变化，触发回调
      if (previousStatus !== isHealthy && this.onStatusChange) {
        this.onStatusChange(this.currentStatus)
      }

    } catch (error) {
      this.currentStatus.consecutiveFailures++
      this.currentStatus.isHealthy = false
      this.currentStatus.error = error.message

      if (this.onStatusChange) {
        this.onStatusChange(this.currentStatus)
      }
    }
  }

  /**
   * 处理网络断开
   */
  handleOffline() {
    this.currentStatus.isHealthy = false
    this.currentStatus.isConnected = false
    this.currentStatus.serverReachable = false
    this.currentStatus.error = '网络连接断开'

    if (this.onStatusChange) {
      this.onStatusChange(this.currentStatus)
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return { ...this.currentStatus }
  }

  /**
   * 手动触发检查
   */
  async refresh() {
    await this.checkHealth()
    return this.getStatus()
  }
}

/**
 * 创建全局健康检查器实例
 */
let globalHealthChecker = null

export function createGlobalHealthChecker(options = {}) {
  if (globalHealthChecker) {
    globalHealthChecker.stop()
  }

  globalHealthChecker = new HealthChecker(options)
  return globalHealthChecker
}

export function getGlobalHealthChecker() {
  return globalHealthChecker
}
