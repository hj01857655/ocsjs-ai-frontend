import { request } from '@/utils/request'

/**
 * 获取缓存状态
 * @returns {Promise}
 */
export function getCacheStatus() {
  return request.get('/cache/status')
}

/**
 * 获取缓存统计信息
 * @returns {Promise}
 */
export function getCacheStats() {
  return request.get('/cache/stats')
}

/**
 * 清空所有缓存
 * @returns {Promise}
 */
export function clearAllCache() {
  return request.post('/cache/clear')
}

/**
 * 清空指定类型的缓存
 * @param {string} type 缓存类型
 * @returns {Promise}
 */
export function clearCache(type) {
  return request.post('/cache/clear', { type })
}

/**
 * 获取缓存键列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getCacheKeys(params) {
  return request.get('/cache/keys', { params })
}

/**
 * 获取缓存键详情
 * @param {string} key 缓存键
 * @returns {Promise}
 */
export function getCacheKeyDetail(key) {
  return request.get(`/cache/keys/${encodeURIComponent(key)}`)
}

/**
 * 删除缓存键
 * @param {string} key 缓存键
 * @returns {Promise}
 */
export function deleteCacheKey(key) {
  return request.delete(`/cache/keys/${encodeURIComponent(key)}`)
}

/**
 * 获取热门缓存
 * @param {number} limit 限制数量
 * @returns {Promise}
 */
export function getHotCache(limit = 10) {
  return request.get('/cache/hot', { params: { limit } })
}

/**
 * 缓存预热
 * @param {Array} questions 问题数据
 * @returns {Promise}
 */
export function preloadCache(questions) {
  return request.post('/cache/preload', { questions })
}

/**
 * 获取缓存配置
 * @returns {Promise}
 */
export function getCacheConfig() {
  return request.get('/cache/config')
}

/**
 * 更新缓存配置
 * @param {Object} config 配置数据
 * @returns {Promise}
 */
export function updateCacheConfig(config) {
  return request.put('/cache/config', config)
}

/**
 * 获取缓存统计历史数据
 * @param {string} period 时间段 '1h', '24h', '7d'
 * @returns {Promise}
 */
export function getCacheStatsHistory(period = '24h') {
  return request.get('/cache/stats/history', { params: { period } })
} 