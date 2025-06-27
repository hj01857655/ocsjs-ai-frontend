import { request } from '@/utils/request'

/**
 * 搜索题目
 * @param {Object} params 搜索参数
 * @returns {Promise}
 */
export function searchQuestion(params) {
  return request.post('/questions/search', params, {
    timeout: 90000 // AI搜索可能需要更长时间，设置90秒超时
  })
}

/**
 * 批量搜索题目
 * @param {Object} data 批量搜索数据
 * @returns {Promise}
 */
export function batchSearchQuestions(data) {
  return request.post('/questions/batch-search', data)
}

/**
 * 获取搜索历史
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getSearchHistory(params) {
  return request.get('/questions/search-history', params)
}

/**
 * 清除搜索历史
 * @returns {Promise}
 */
export function clearSearchHistory() {
  return request.delete('/questions/search-history')
}

/**
 * 获取热门搜索
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getHotSearches(params) {
  return request.get('/search/hot', params)
}

/**
 * 获取搜索建议
 * @param {string} keyword 关键词
 * @returns {Promise}
 */
export function getSearchSuggestions(keyword) {
  return request.get('/search/suggestions', { keyword })
}

/**
 * 获取搜索统计
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getSearchStatistics(params) {
  return request.get('/search/statistics', params)
}
