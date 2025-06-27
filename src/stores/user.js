import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, logout, getUserInfo as getUserInfoAPI } from '@/api/auth'
import { removeToken, setToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref('')
  const userInfo = ref({
    id: '',
    username: '',
    email: '',
    role: '',
    avatar: '',
    permissions: []
  })

  const loginLoading = ref(false)

  // 方法
  const userLogin = async (loginForm) => {
    try {
      loginLoading.value = true
      const response = await login(loginForm)

      if (response.success) {
        token.value = response.data.token
        setToken(response.data.token)

        // 获取用户信息
        await getUserInfo()

        ElMessage.success('登录成功')
        return Promise.resolve(response)
      } else {
        ElMessage.error(response.message || '登录失败')
        return Promise.reject(new Error(response.message))
      }
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
      return Promise.reject(error)
    } finally {
      loginLoading.value = false
    }
  }

  const getUserInfo = async () => {
    try {
      const response = await getUserInfoAPI()

      if (response.success) {
        userInfo.value = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email || '',
          role: response.data.role || 'user',
          avatar: response.data.avatar || '',
          permissions: response.data.permissions || []
        }

        // 保存用户信息到localStorage
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))

        return Promise.resolve(response.data)
      } else {
        return Promise.reject(new Error(response.message))
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return Promise.reject(error)
    }
  }

  const userLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.warn('登出API调用失败:', error)
    } finally {
      // 清除本地状态
      token.value = ''
      userInfo.value = {
        id: '',
        username: '',
        email: '',
        role: '',
        avatar: '',
        permissions: []
      }
      removeToken()

      // 清除其他相关缓存
      localStorage.removeItem('userInfo')

      ElMessage.success('已退出登录')
    }
  }

  const updateUserInfo = (newUserInfo) => {
    userInfo.value = { ...userInfo.value, ...newUserInfo }
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  const hasPermission = (permission) => {
    if (!permission) return true
    if (userInfo.value.role === 'admin') return true
    return userInfo.value.permissions.includes(permission)
  }

  const hasRole = (role) => {
    if (!role) return true
    return userInfo.value.role === role
  }

  const hasAnyRole = (roles) => {
    if (!roles || roles.length === 0) return true
    return roles.includes(userInfo.value.role)
  }

  const resetUser = () => {
    token.value = ''
    userInfo.value = {
      id: '',
      username: '',
      email: '',
      role: '',
      avatar: '',
      permissions: []
    }
    loginLoading.value = false
    removeToken()
    localStorage.removeItem('userInfo')
  }

  // 初始化用户信息
  const initUser = () => {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (error) {
        console.warn('解析用户信息失败:', error)
        localStorage.removeItem('userInfo')
      }
    }
  }

  return {
    // 状态
    token,
    userInfo,
    loginLoading,

    // 方法
    userLogin,
    getUserInfo,
    userLogout,
    updateUserInfo,
    hasPermission,
    hasRole,
    hasAnyRole,
    resetUser,
    initUser
  }
})
