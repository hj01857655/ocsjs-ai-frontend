import Cookies from 'js-cookie'

const TokenKey = 'edubrain-token'
const TokenExpireKey = 'edubrain-token-expire'

/**
 * 获取token
 */
export function getToken() {
  // 优先从localStorage获取
  const token = localStorage.getItem(TokenKey)
  if (token) {
    return token
  }
  
  // 备用从Cookie获取
  return Cookies.get(TokenKey)
}

/**
 * 设置token
 */
export function setToken(token, expires = null) {
  // 保存到localStorage
  localStorage.setItem(TokenKey, token)
  
  // 设置过期时间
  if (expires) {
    const expireTime = new Date(Date.now() + expires * 1000)
    localStorage.setItem(TokenExpireKey, expireTime.getTime())
    
    // 同时保存到Cookie（7天过期）
    Cookies.set(TokenKey, token, { expires: 7 })
  } else {
    // 默认7天过期
    const expireTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    localStorage.setItem(TokenExpireKey, expireTime.getTime())
    Cookies.set(TokenKey, token, { expires: 7 })
  }
}

/**
 * 移除token
 */
export function removeToken() {
  localStorage.removeItem(TokenKey)
  localStorage.removeItem(TokenExpireKey)
  Cookies.remove(TokenKey)
}

/**
 * 检查token是否过期
 */
export function isTokenExpired() {
  const token = getToken()
  if (!token) {
    return true
  }
  
  const expireTime = localStorage.getItem(TokenExpireKey)
  if (!expireTime) {
    return false // 如果没有过期时间，认为未过期
  }
  
  return Date.now() > parseInt(expireTime)
}

/**
 * 刷新token过期时间
 */
export function refreshTokenExpire(expires = 7 * 24 * 60 * 60) {
  const token = getToken()
  if (token) {
    setToken(token, expires)
  }
}

/**
 * 获取token剩余时间（秒）
 */
export function getTokenRemainingTime() {
  const expireTime = localStorage.getItem(TokenExpireKey)
  if (!expireTime) {
    return null
  }
  
  const remaining = parseInt(expireTime) - Date.now()
  return Math.max(0, Math.floor(remaining / 1000))
}

/**
 * 检查是否已登录
 */
export function isLoggedIn() {
  return !!getToken() && !isTokenExpired()
}

/**
 * 自动刷新token
 */
export function autoRefreshToken() {
  const remainingTime = getTokenRemainingTime()
  
  // 如果剩余时间少于1小时，自动刷新
  if (remainingTime && remainingTime < 3600) {
    refreshTokenExpire()
    console.log('Token已自动刷新')
  }
}

// 定期检查token状态
if (typeof window !== 'undefined') {
  // 每5分钟检查一次token状态
  setInterval(() => {
    if (isLoggedIn()) {
      autoRefreshToken()
    }
  }, 5 * 60 * 1000)
  
  // 页面可见性变化时检查token
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isLoggedIn()) {
      autoRefreshToken()
    }
  })
}
