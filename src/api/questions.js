import { request } from '@/utils/request'

/**
 * 添加题目到题库
 * @param {Object} data 题目数据
 * @returns {Promise}
 */
export function addQuestion(data) {
  return request.post('/question-management/add', data)
}

/**
 * 获取题目列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getQuestions(params) {
  return request.get('/question-management', { params })
}

/**
 * 获取题目详情
 * @param {number} id 题目ID
 * @returns {Promise}
 */
export function getQuestion(id) {
  return request.get(`/question-management/${id}`)
}

/**
 * 更新题目
 * @param {number} id 题目ID
 * @param {Object} data 题目数据
 * @returns {Promise}
 */
export function updateQuestion(id, data) {
  return request.put(`/question-management/${id}`, data)
}

/**
 * 删除题目
 * @param {number} id 题目ID
 * @returns {Promise}
 */
export function deleteQuestion(id) {
  return request.delete(`/question-management/${id}`)
}

/**
 * 批量删除题目
 * @param {Array} questionIds 题目ID数组
 * @returns {Promise}
 */
export function batchDeleteQuestions(questionIds) {
  return request.post('/question-management/batch-delete', { question_ids: questionIds })
}

/**
 * 收藏题目
 * @param {number} id 题目ID
 * @returns {Promise}
 */
export function favoriteQuestion(id) {
  return request.post(`/question-management/${id}/favorite`)
}

/**
 * 取消收藏题目
 * @param {number} id 题目ID
 * @returns {Promise}
 */
export function unfavoriteQuestion(id) {
  return request.delete(`/question-management/${id}/favorite`)
}

/**
 * 导出题目
 * @param {Object} params 导出参数
 * @returns {Promise}
 */
export function exportQuestions(params = {}) {
  return request.get('/question-management/export', { params })
}

/**
 * 智能导入题目
 * @param {string} content 导入内容
 * @returns {Promise}
 */
export function smartImportQuestions(content) {
  return request.post('/question-management/smart-import', { content })
}

/**
 * 获取题库统计信息
 * @returns {Promise}
 */
export function getQuestionStatistics() {
  return request.get('/question-management/statistics')
}





/**
 * 获取题目类型统计
 * @returns {Promise}
 */
export function getQuestionTypeStats() {
  return request.get('/questions/stats/types')
}

/**
 * 获取题目难度统计
 * @returns {Promise}
 */
export function getQuestionDifficultyStats() {
  return request.get('/questions/stats/difficulty')
}

/**
 * 搜索题目
 * @param {Object} params 搜索参数
 * @returns {Promise}
 */
export function searchQuestions(params) {
  return request({
    url: '/api/questions/search',
    method: 'get',
    params
  })
}

/**
 * 获取相似题目
 * @param {number} id 题目ID
 * @returns {Promise}
 */
export function getSimilarQuestions(id) {
  return request({
    url: `/api/questions/${id}/similar`,
    method: 'get'
  })
}

/**
 * 获取仪表板数据
 * @returns {Promise}
 */
export function getDashboardData() {
  return request.get('/questions/dashboard', {}, { timeout: 10000 }) // 10秒超时
}

/**
 * 获取系统信息
 * @returns {Promise}
 */
export function getSystemInfo() {
  return request.get('/system/info', {}, { timeout: 5000 }) // 5秒超时
}



/**
 * 获取收藏的题目列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getFavoriteQuestions(params) {
  return request.get('/question-management', { params: { ...params, favorite: true } })
}

/**
 * 保存题目（用于搜题结果保存）
 * @param {Object} data 题目数据
 * @returns {Promise}
 */
export function saveQuestion(data) {
  return request.post('/question-management/save', data)
}
