import { request } from '@/utils/request'

/**
 * 健康检查API
 */

// 健康检查请求配置
const HEALTH_CHECK_CONFIG = {
  QUICK_TIMEOUT: 5000,
  NORMAL_TIMEOUT: 10000,
  LONG_TIMEOUT: 30000,
  NO_ERROR_MESSAGE: { showErrorMessage: false }
}

/**
 * 创建健康检查函数的工厂方法
 * @param {string} endpoint API端点
 * @param {string} method HTTP方法
 * @param {Object} options 请求选项
 * @returns {Function} 健康检查函数
 */
function createHealthCheckFunction(endpoint, method = 'GET', options = {}) {
  return function (data = {}) {
    const config = {
      timeout: HEALTH_CHECK_CONFIG.QUICK_TIMEOUT,
      ...HEALTH_CHECK_CONFIG.NO_ERROR_MESSAGE,
      ...options
    }

    if (method === 'GET') {
      return request.get(endpoint, config)
    } else {
      return request[method.toLowerCase()](endpoint, data, config)
    }
  }
}

// 使用工厂函数创建健康检查API
export const checkSystemHealth = createHealthCheckFunction('/system-monitor/health')
export const getDatabaseHealth = createHealthCheckFunction('/db-monitor/health')
export const getApiProxyStatus = createHealthCheckFunction('/api-proxy-management/status')

export const getSystemStats = createHealthCheckFunction('/system-monitor/stats', 'GET', {
  timeout: HEALTH_CHECK_CONFIG.NORMAL_TIMEOUT,
  showErrorMessage: true
})

export const testDatabaseConnection = createHealthCheckFunction('/db-monitor/test-connection', 'POST', {
  timeout: HEALTH_CHECK_CONFIG.NORMAL_TIMEOUT
})

export const triggerApiProxyHealthCheck = createHealthCheckFunction('/api-proxy-management/health-check', 'POST', {
  timeout: HEALTH_CHECK_CONFIG.LONG_TIMEOUT
})

/**
 * 简单的健康检查（用于网络连接测试）
 * 遵循前端开发规范：使用相对路径，通过代理转发
 * @returns {Promise}
 */
export function simpleHealthCheck() {
  // 使用原生fetch访问代理路径，避免axios拦截器影响
  return fetch('/health', {
    method: 'GET',
    cache: 'no-cache',
    signal: AbortSignal.timeout(HEALTH_CHECK_CONFIG.QUICK_TIMEOUT),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  })
}

/**
 * 综合健康检查
 * 检查系统、数据库、API代理等多个组件的健康状态
 * @returns {Promise}
 */
export async function comprehensiveHealthCheck() {
  const results = {
    overall: false,
    components: {},
    timestamp: new Date().toISOString()
  }

  // 并行检查各个组件
  const checks = [
    {
      name: 'system',
      check: () => checkSystemHealth()
    },
    {
      name: 'database',
      check: () => getDatabaseHealth()
    },
    {
      name: 'api_proxy',
      check: () => getApiProxyStatus()
    }
  ]

  const checkPromises = checks.map(async ({ name, check }) => {
    try {
      const result = await check()
      results.components[name] = {
        healthy: true,
        data: result.data || result,
        error: null
      }
      return true
    } catch (error) {
      results.components[name] = {
        healthy: false,
        data: null,
        error: error.message
      }
      return false
    }
  })

  const checkResults = await Promise.allSettled(checkPromises)

  // 计算整体健康状态
  const healthyCount = checkResults.filter(result =>
    result.status === 'fulfilled' && result.value === true
  ).length

  results.overall = healthyCount >= Math.ceil(checks.length / 2) // 超过一半组件健康即认为整体健康
  results.healthyCount = healthyCount
  results.totalCount = checks.length

  return results
}
