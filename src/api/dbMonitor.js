import request from '@/utils/request'

// 数据库监控API
export const dbMonitorApi = {
  // 获取数据库统计信息
  getStats() {
    return request({
      url: '/api/db-monitor/stats',
      method: 'get'
    })
  },

  // 获取数据库健康状态
  getHealth() {
    return request({
      url: '/api/db-monitor/health',
      method: 'get'
    })
  },

  // 获取优化建议
  getOptimizationRecommendations() {
    return request({
      url: '/api/db-monitor/optimize',
      method: 'get'
    })
  },

  // 重置统计数据
  resetStats() {
    return request({
      url: '/api/db-monitor/reset-stats',
      method: 'post'
    })
  },

  // 测试数据库连接
  testConnection() {
    return request({
      url: '/api/db-monitor/test-connection',
      method: 'post'
    })
  },

  // 获取查询统计
  getQueryStats() {
    return request({
      url: '/api/db-monitor/query-stats',
      method: 'get'
    })
  },

  // 获取连接池状态
  getPoolStatus() {
    return request({
      url: '/api/db-monitor/pool-status',
      method: 'get'
    })
  }
}
