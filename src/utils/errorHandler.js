/**
 * 统一错误处理工具
 */
import { ElMessage, ElNotification } from 'element-plus'

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  AUTH: 'auth',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  SERVER: 'server',
  UNKNOWN: 'unknown'
}

/**
 * 错误严重程度
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

/**
 * 错误分类器
 */
export class ErrorClassifier {
  /**
   * 分类HTTP错误
   * @param {Object} error 错误对象
   * @returns {Object} 错误信息
   */
  static classifyHttpError(error) {
    const { response, code, message } = error
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 400:
          return {
            type: ErrorTypes.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            message: data?.message || '请求参数错误',
            shouldRetry: false,
            userMessage: '请检查输入信息是否正确'
          }
          
        case 401:
          return {
            type: ErrorTypes.AUTH,
            severity: ErrorSeverity.HIGH,
            message: '认证失败',
            shouldRetry: false,
            userMessage: '登录已过期，请重新登录',
            requiresReauth: true
          }
          
        case 403:
          return {
            type: ErrorTypes.PERMISSION,
            severity: ErrorSeverity.HIGH,
            message: '权限不足',
            shouldRetry: false,
            userMessage: '您没有权限执行此操作'
          }
          
        case 404:
          return {
            type: ErrorTypes.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            message: '资源不存在',
            shouldRetry: false,
            userMessage: '请求的资源不存在'
          }
          
        case 429:
          return {
            type: ErrorTypes.NETWORK,
            severity: ErrorSeverity.MEDIUM,
            message: '请求过于频繁',
            shouldRetry: true,
            userMessage: '请求过于频繁，请稍后再试',
            retryDelay: 5000
          }
          
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: ErrorTypes.SERVER,
            severity: ErrorSeverity.HIGH,
            message: '服务器错误',
            shouldRetry: true,
            userMessage: '服务器暂时不可用，请稍后重试',
            retryDelay: 3000
          }
          
        default:
          return {
            type: ErrorTypes.UNKNOWN,
            severity: ErrorSeverity.MEDIUM,
            message: data?.message || `请求失败 (${status})`,
            shouldRetry: false,
            userMessage: '请求失败，请稍后重试'
          }
      }
    }
    
    // 处理网络错误
    if (code === 'ECONNABORTED') {
      return {
        type: ErrorTypes.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        message: '请求超时',
        shouldRetry: true,
        userMessage: '请求超时，请检查网络连接',
        retryDelay: 2000
      }
    }
    
    if (message === 'Network Error') {
      return {
        type: ErrorTypes.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: '网络连接失败',
        shouldRetry: true,
        userMessage: '网络连接失败，请检查网络',
        retryDelay: 3000
      }
    }
    
    return {
      type: ErrorTypes.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: message || '未知错误',
      shouldRetry: false,
      userMessage: '操作失败，请稍后重试'
    }
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.showNotification = options.showNotification !== false
    this.logErrors = options.logErrors !== false
    this.onError = options.onError || null
    this.retryHandler = options.retryHandler || null
  }

  /**
   * 处理错误
   * @param {Object} error 错误对象
   * @param {Object} context 上下文信息
   * @returns {Object} 处理结果
   */
  handle(error, context = {}) {
    const errorInfo = ErrorClassifier.classifyHttpError(error)
    
    // 记录错误日志
    if (this.logErrors) {
      this.logError(error, errorInfo, context)
    }
    
    // 显示用户通知
    if (this.showNotification) {
      this.showUserNotification(errorInfo, context)
    }
    
    // 触发自定义错误处理
    if (this.onError) {
      this.onError(error, errorInfo, context)
    }
    
    // 处理需要重新认证的错误
    if (errorInfo.requiresReauth) {
      this.handleReauth()
    }
    
    return {
      ...errorInfo,
      context,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 记录错误日志
   */
  logError(error, errorInfo, context) {
    const logData = {
      error: {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      },
      errorInfo,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    console.error('Error handled:', logData)
    
    // 可以在这里发送错误日志到后端
    // this.sendErrorLog(logData)
  }

  /**
   * 显示用户通知
   */
  showUserNotification(errorInfo, context) {
    const { severity, userMessage, type } = errorInfo
    
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      ElNotification({
        title: '错误',
        message: userMessage,
        type: 'error',
        duration: 5000
      })
    } else {
      ElMessage({
        message: userMessage,
        type: type === ErrorTypes.VALIDATION ? 'warning' : 'error',
        duration: 3000
      })
    }
  }

  /**
   * 处理重新认证
   */
  handleReauth() {
    // 清除本地认证信息
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    
    // 跳转到登录页
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  /**
   * 重试处理
   */
  async retry(originalRequest, errorInfo) {
    if (!errorInfo.shouldRetry || !this.retryHandler) {
      return false
    }
    
    // 等待重试延迟
    if (errorInfo.retryDelay) {
      await new Promise(resolve => setTimeout(resolve, errorInfo.retryDelay))
    }
    
    try {
      return await this.retryHandler(originalRequest)
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      return false
    }
  }
}

/**
 * 创建全局错误处理器
 */
let globalErrorHandler = null

export function createGlobalErrorHandler(options = {}) {
  globalErrorHandler = new ErrorHandler(options)
  return globalErrorHandler
}

export function getGlobalErrorHandler() {
  return globalErrorHandler
}

/**
 * 快捷错误处理函数
 */
export function handleError(error, context = {}) {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler()
  }
  
  return globalErrorHandler.handle(error, context)
}

/**
 * 异步操作错误包装器
 */
export function withErrorHandling(asyncFn, context = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      handleError(error, { ...context, function: asyncFn.name })
      throw error
    }
  }
}
