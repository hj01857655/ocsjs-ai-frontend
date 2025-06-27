/**
 * 前端日志收集器
 * 将前端日志发送到后端系统日志
 */
import { request } from './request'

class FrontendLogger {
  constructor() {
    this.logQueue = []
    this.isProcessing = false
    this.maxQueueSize = 100
    this.flushInterval = 5000 // 5秒

    // 启动定时发送
    this.startFlushTimer()

    // 页面卸载时发送剩余日志
    window.addEventListener('beforeunload', () => {
      this.flush(true)
    })
  }

  /**
   * 记录日志
   */
  log(level, message, context = {}) {
    const logEntry = {
      level,
      message,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    }

    this.logQueue.push(logEntry)

    // 如果队列满了，立即发送
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flush()
    }
  }

  /**
   * 发送日志到后端
   */
  async flush(sync = false) {
    if (this.isProcessing || this.logQueue.length === 0) {
      return
    }

    this.isProcessing = true
    const logs = [...this.logQueue]
    this.logQueue = []

    try {
      if (sync) {
        // 同步发送（页面卸载时）
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
        navigator.sendBeacon(`${baseURL}/logs/frontend`, JSON.stringify({ logs }))
      } else {
        // 异步发送
        await request.post('/logs/frontend', { logs })
      }
    } catch (error) {
      // 发送失败，重新加入队列
      this.logQueue.unshift(...logs)
      console.error('发送前端日志失败:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 启动定时发送
   */
  startFlushTimer() {
    const scheduleFlush = () => {
      setTimeout(() => {
        this.flush().finally(() => {
          // 只有在没有被销毁的情况下才继续调度
          if (this.logQueue !== null) {
            scheduleFlush()
          }
        })
      }, this.flushInterval)
    }
    scheduleFlush()
  }

  // 便捷方法
  info(message, context) {
    this.log('info', message, context)
  }

  warn(message, context) {
    this.log('warn', message, context)
  }

  error(message, context) {
    this.log('error', message, context)
  }

  debug(message, context) {
    this.log('debug', message, context)
  }
}

// 创建全局实例
const logger = new FrontendLogger()

// 拦截原生console方法
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
}

// 重写console方法，同时发送到后端
console.log = function (...args) {
  originalConsole.log.apply(console, args)
  if (import.meta.env.PROD) {
    logger.info(args.join(' '), { type: 'console.log' })
  }
}

console.info = function (...args) {
  originalConsole.info.apply(console, args)
  if (import.meta.env.PROD) {
    logger.info(args.join(' '), { type: 'console.info' })
  }
}

console.warn = function (...args) {
  originalConsole.warn.apply(console, args)
  logger.warn(args.join(' '), { type: 'console.warn' })
}

console.error = function (...args) {
  originalConsole.error.apply(console, args)
  logger.error(args.join(' '), { type: 'console.error' })
}

console.debug = function (...args) {
  originalConsole.debug.apply(console, args)
  if (import.meta.env.DEV) {
    logger.debug(args.join(' '), { type: 'console.debug' })
  }
}

// 捕获未处理的错误
window.addEventListener('error', (event) => {
  logger.error(`未捕获的错误: ${event.message}`, {
    type: 'unhandled_error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  })
})

// 捕获未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  logger.error(`未处理的Promise拒绝: ${event.reason}`, {
    type: 'unhandled_rejection',
    reason: event.reason
  })
})

export default logger
