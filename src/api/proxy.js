import { request } from '@/utils/request'

// ==================== API代理管理 ====================

/**
 * 获取API代理池状态
 * @returns {Promise}
 */
export function getApiProxyStatus() {
  return request.get('/api-proxy-management/status')
}

/**
 * 获取API代理列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getApiProxyList(params) {
  return request.get('/api-proxy-management/list', { params })
}

/**
 * 获取API代理详情
 * @param {string} name 代理名称
 * @returns {Promise}
 */
export function getApiProxyDetail(name) {
  return request.get(`/api-proxy-management/${encodeURIComponent(name)}`)
}

/**
 * 添加API代理
 * @param {Object} data 代理数据
 * @returns {Promise}
 */
export function addApiProxy(data) {
  return request.post('/api-proxy-management/add', data)
}

/**
 * 删除API代理
 * @param {string} name 代理名称
 * @returns {Promise}
 */
export function deleteApiProxy(name) {
  return request.delete(`/api-proxy-management/${encodeURIComponent(name)}`)
}

/**
 * 更新API代理状态
 * @param {string} name 代理名称
 * @param {boolean} isActive 是否激活
 * @returns {Promise}
 */
export function updateApiProxyStatus(name, isActive) {
  return request.put(`/api-proxy-management/${encodeURIComponent(name)}/status`, {
    is_active: isActive
  })
}

/**
 * 重置API代理错误计数
 * @param {string} name 代理名称
 * @returns {Promise}
 */
export function resetApiProxyErrors(name) {
  return request.post(`/api-proxy-management/${encodeURIComponent(name)}/reset`)
}

/**
 * 测试API代理
 * @param {string} name 代理名称
 * @param {Object} options 测试选项，如模型等
 * @returns {Promise}
 */
export function testApiProxy(name, options = {}) {
  return request.post(`/api-proxy-management/${encodeURIComponent(name)}/test`, options)
}

/**
 * 重新加载API代理配置
 * @returns {Promise}
 */
export function reloadApiProxyConfig() {
  return request.post('/api-proxy-management/reload')
}

/**
 * 批量操作API代理
 * @param {string} action 操作类型: activate, deactivate, reset
 * @param {Array<string>} names 代理名称数组
 * @returns {Promise}
 */
export function batchApiProxyOperation(action, names) {
  return request.post('/api-proxy-management/batch', {
    action,
    names
  })
}

/**
 * 触发API代理健康检查
 * @returns {Promise}
 */
export function triggerApiProxyHealthCheck() {
  return request.post('/api-proxy-management/health-check')
}

/**
 * 设置API代理优先级
 * @param {string} name 代理名称
 * @param {number} priority 优先级
 * @returns {Promise}
 */
export function setApiProxyPriority(name, priority) {
  return request.put(`/api-proxy-management/${encodeURIComponent(name)}/priority`, {
    priority
  })
}

/**
 * 更新API代理信息
 * @param {string} name 原代理名称
 * @param {Object} data 更新数据
 * @returns {Promise}
 */
export function updateApiProxy(name, data) {
  return request.put(`/api-proxy-management/${encodeURIComponent(name)}`, data)
}

/**
 * 导出API代理配置
 * @returns {Promise}
 */
export function exportApiProxyConfig() {
  return request.get('/api-proxy-management/export', {
    responseType: 'blob'
  })
}

/**
 * 导入API代理配置
 * @param {FormData} formData 包含配置文件的表单数据
 * @returns {Promise}
 */
export function importApiProxyConfig(formData) {
  return request.post('/api-proxy-management/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 验证API代理配置
 * @param {Object} config 代理配置
 * @returns {Promise}
 */
export function validateApiProxyConfig(config) {
  return request.post('/api-proxy-management/validate', config)
}

/**
 * 设置API代理告警规则
 * @param {Object} rules 告警规则
 * @returns {Promise}
 */
export function setApiProxyAlertRules(rules) {
  return request.post('/api-proxy-management/alert-rules', rules)
}

/**
 * 获取所有支持的模型列表
 * @returns {Promise}
 */
export function getSupportedModels() {
  return request.get('/api-proxy-management/models')
}

/**
 * 根据API和密钥自动发现支持的模型
 * @param {string} apiBase API地址
 * @param {string} apiKey API密钥
 * @returns {Promise}
 */
export function discoverModelsFromApi(apiBase, apiKey) {
  return request.post('/api-proxy-management/models/discover', {
    api_base: apiBase,
    api_key: apiKey
  })
}

/**
 * 获取API代理的密钥列表
 * @param {string} name 代理名称
 * @returns {Promise}
 */
export function getApiProxyKeys(name) {
  return request.get(`/api-proxy-management/${encodeURIComponent(name)}/keys`)
}

/**
 * 更新API代理的密钥列表
 * @param {string} name 代理名称
 * @param {Array<string>} keys 密钥列表
 * @returns {Promise}
 */
export function updateApiProxyKeys(name, keys) {
  return request.put(`/api-proxy-management/${encodeURIComponent(name)}/keys`, {
    keys
  })
}

/**
 * 添加API密钥到代理
 * @param {string} name 代理名称
 * @param {string} key API密钥
 * @returns {Promise}
 */
export function addApiProxyKey(name, key) {
  return request.post(`/api-proxy-management/${encodeURIComponent(name)}/keys/add`, {
    key
  })
}

/**
 * 从代理中移除API密钥
 * @param {string} name 代理名称
 * @param {string} key API密钥
 * @returns {Promise}
 */
export function removeApiProxyKey(name, key) {
  return request.post(`/api-proxy-management/${encodeURIComponent(name)}/keys/remove`, {
    key
  })
}

/**
 * 获取API代理告警规则
 * @returns {Promise}
 */
export function getApiProxyAlertRules() {
  return request.get('/api-proxy-management/alert-rules')
}

/**
 * 更新API代理的可用模型列表
 * @param {string} name 代理名称
 * @param {Array<string>} models 可用模型列表
 * @returns {Promise}
 */
export function updateAvailableModels(name, models) {
  return request.put(`/api-proxy-management/${encodeURIComponent(name)}/available-models`, {
    models
  })
}

/**
 * 测试API代理的模型可用性
 * @param {string} name 代理名称
 * @param {Object} options 测试选项
 * @returns {Promise}
 */
export function testModelAvailability(name, options = {}) {
  return request.post(`/api-proxy-management/${encodeURIComponent(name)}/available-models/test`, options)
}

/**
 * 更新配置文件中的可用模型列表
 * @param {Object} results 测试结果
 * @returns {Promise}
 */
export function updateAvailableModelsConfig(results) {
  return request.post('/api-proxy-management/update-available-models', { results })
}

/**
 * 获取模型测试进度
 * @param {string} proxyName 代理名称
 * @returns {Promise}
 */
export function getTestProgress(proxyName) {
  return request.get(`/api-proxy-management/${encodeURIComponent(proxyName)}/test-progress`)
}

/**
 * 获取系统设置
 */
export function getSystemSettings() {
  return request({
    url: '/api/system/settings',
    method: 'get'
  })
}

/**
 * 更新系统设置
 * @param {Object} data 系统设置数据
 */
export function updateSystemSettings(data) {
  return request({
    url: '/api/system/settings',
    method: 'post',
    data
  })
}


