import { request } from '@/utils/request'

/**
 * 获取系统日志列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getLogsList(params) {
  return request.get('/logs/list', { params })
}

/**
 * 获取日志统计信息
 * @returns {Promise}
 */
export function getLogsStatistics() {
  return request.get('/logs/statistics')
}

/**
 * 清空系统日志
 * @param {Object} data 清空参数 { days: number } 
 * @returns {Promise}
 */
export function clearLogs(data = {}) {
  return request.post('/logs/clear', data)
}

/**
 * 导出系统日志
 * @param {Object} data 导出参数
 * @returns {Promise}
 */
export function exportLogs(data = {}) {
  return request.post('/logs/export', data)
}

/**
 * 获取日志级别选项
 * @returns {Array}
 */
export function getLogLevels() {
  return [
    { label: 'DEBUG', value: 'debug' },
    { label: 'INFO', value: 'info' },
    { label: 'WARN', value: 'warn' },
    { label: 'ERROR', value: 'error' },
    { label: 'FATAL', value: 'fatal' }
  ]
}

/**
 * 获取日志来源选项
 * @returns {Array}
 */
export function getLogSources() {
  return [
    { label: 'API服务', value: 'api' },
    { label: '数据库', value: 'database' },
    { label: '缓存', value: 'cache' },
    { label: '代理池', value: 'proxy' },
    { label: '搜索引擎', value: 'search' },
    { label: '认证', value: 'auth' },
    { label: '系统', value: 'system' }
  ]
}
