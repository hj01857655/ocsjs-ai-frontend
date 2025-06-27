import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getToken, removeToken } from './auth'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000, // 增加到60秒，给AI搜索更多时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加认证token
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      config.headers['X-Access-Token'] = token
    }

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }

    // 请求日志
    if (import.meta.env.DEV) {
      console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`, config.data || config.params)
    }

    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 响应日志
    if (import.meta.env.DEV) {
      console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url}`, res)
    }

    // 处理不同的响应格式
    // 兼容旧版API格式 {code: 1, msg: '', data: {}}
    if (res.hasOwnProperty('code')) {
      if (res.code === 1) {
        return {
          success: true,
          data: res.data || res,
          message: res.msg || 'success'
        }
      } else {
        const errorMsg = res.msg || '请求失败'
        ElMessage.error(errorMsg)
        return Promise.reject(new Error(errorMsg))
      }
    }

    // 新版API格式 {success: true, data: {}, message: ''}
    if (res.hasOwnProperty('success')) {
      if (res.success) {
        return res
      } else {
        const errorMsg = res.message || '请求失败'
        ElMessage.error(errorMsg)
        return Promise.reject(new Error(errorMsg))
      }
    }

    // 直接返回数据
    return {
      success: true,
      data: res,
      message: 'success'
    }
  },
  error => {
    console.error('响应拦截器错误:', error)

    let message = '网络错误'
    const { response } = error

    if (response) {
      const { status, data } = response

      switch (status) {
        case 400:
          message = data?.message || '请求参数错误'
          break
        case 401:
          message = '登录已过期，请重新登录'
          handleTokenExpired()
          break
        case 403:
          message = '权限不足'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 429:
          message = '请求过于频繁，请稍后再试'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = data?.message || `请求失败 (${status})`
      }
    } else if (error.code === 'ECONNABORTED') {
      if (error.config?.url?.includes('/questions/search')) {
        message = 'AI搜索超时，请稍后重试或尝试简化问题'
      } else {
        message = '请求超时，请检查网络连接'
      }
    } else if (error.message === 'Network Error') {
      message = '网络连接失败，请检查网络'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 处理token过期
const handleTokenExpired = () => {
  const userStore = useUserStore()

  ElMessageBox.confirm(
    '登录状态已过期，您可以继续留在该页面，或者重新登录',
    '系统提示',
    {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    userStore.resetUser()
    router.push('/login')
  }).catch(() => {
    // 用户选择取消，不做任何操作
  })
}

// 请求方法封装
export const request = {
  get(url, params = {}, config = {}) {
    return service.get(url, { params, ...config })
  },

  post(url, data = {}, config = {}) {
    return service.post(url, data, config)
  },

  put(url, data = {}, config = {}) {
    return service.put(url, data, config)
  },

  delete(url, config = {}) {
    return service.delete(url, config)
  },

  upload(url, formData, config = {}) {
    return service.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
  },

  download(url, params = {}, config = {}) {
    return service.get(url, {
      params,
      responseType: 'blob',
      ...config
    })
  }
}

export default service
