import { request } from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data 登录数据
 * @returns {Promise}
 */
export function login(data) {
  return request.post('/auth/login', data)
}

/**
 * 用户注册
 * @param {Object} data 注册数据
 * @returns {Promise}
 */
export function register(data) {
  return request.post('/auth/register', data)
}

/**
 * 用户登出
 * @returns {Promise}
 */
export function logout() {
  return request.post('/auth/logout')
}

/**
 * 获取用户信息
 * @returns {Promise}
 */
export function getUserInfo() {
  return request.get('/auth/user')
}

/**
 * 刷新token
 * @returns {Promise}
 */
export function refreshToken() {
  return request.post('/auth/refresh')
}

/**
 * 修改密码
 * @param {Object} data 密码数据
 * @returns {Promise}
 */
export function changePassword(data) {
  return request.post('/auth/change-password', data)
}

/**
 * 忘记密码
 * @param {Object} data 邮箱数据
 * @returns {Promise}
 */
export function forgotPassword(data) {
  return request.post('/auth/forgot-password', data)
}

/**
 * 重置密码
 * @param {Object} data 重置数据
 * @returns {Promise}
 */
export function resetPassword(data) {
  return request.post('/auth/reset-password', data)
}

/**
 * 验证邮箱
 * @param {Object} data 验证数据
 * @returns {Promise}
 */
export function verifyEmail(data) {
  return request.post('/auth/verify-email', data)
}

/**
 * 发送验证码
 * @param {Object} data 邮箱数据
 * @returns {Promise}
 */
export function sendVerificationCode(data) {
  return request.post('/auth/send-code', data)
}
