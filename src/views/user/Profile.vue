<template>
  <div class="user-profile">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :xs="24" :lg="8">
        <el-card class="profile-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </div>
          </template>
          
          <div class="profile-info">
            <div class="avatar-section">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                action="/api/upload/avatar"
              >
                <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="avatar-tip">点击上传头像</div>
            </div>
            
            <div class="user-details">
              <div class="detail-item">
                <span class="label">用户名:</span>
                <span class="value">{{ userInfo.username }}</span>
              </div>
              <div class="detail-item">
                <span class="label">邮箱:</span>
                <span class="value">{{ userInfo.email }}</span>
              </div>
              <div class="detail-item">
                <span class="label">角色:</span>
                <el-tag :type="getRoleTagType(userInfo.role)">{{ getRoleName(userInfo.role) }}</el-tag>
              </div>
              <div class="detail-item">
                <span class="label">注册时间:</span>
                <span class="value">{{ formatTime(userInfo.created_at) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">最后登录:</span>
                <span class="value">{{ formatTime(userInfo.last_login) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 统计信息 -->
        <el-card class="stats-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>使用统计</span>
            </div>
          </template>
          
          <div class="stats-grid">
            <div v-for="stat in userStats" :key="stat.label" class="stat-item">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 设置表单 -->
      <el-col :xs="24" :lg="16">
        <el-card class="settings-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>账户设置</span>
            </div>
          </template>
          
          <el-tabs v-model="activeTab" class="settings-tabs">
            <!-- 基本信息 -->
            <el-tab-pane label="基本信息" name="basic">
              <el-form
                :model="basicForm"
                :rules="basicRules"
                ref="basicFormRef"
                label-width="100px"
                class="settings-form"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="basicForm.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="basicForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="basicForm.phone" placeholder="请输入手机号" />
                </el-form-item>
                <el-form-item label="真实姓名" prop="real_name">
                  <el-input v-model="basicForm.real_name" placeholder="请输入真实姓名" />
                </el-form-item>
                <el-form-item label="个人简介">
                  <el-input
                    v-model="basicForm.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入个人简介"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveBasicInfo" :loading="saving">保存</el-button>
                  <el-button @click="resetBasicForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 安全设置 -->
            <el-tab-pane label="安全设置" name="security">
              <div class="security-section">
                <!-- 修改密码 -->
                <div class="security-item">
                  <h4>修改密码</h4>
                  <el-form
                    :model="passwordForm"
                    :rules="passwordRules"
                    ref="passwordFormRef"
                    label-width="100px"
                  >
                    <el-form-item label="当前密码" prop="current_password">
                      <el-input
                        v-model="passwordForm.current_password"
                        type="password"
                        placeholder="请输入当前密码"
                        show-password
                      />
                    </el-form-item>
                    <el-form-item label="新密码" prop="new_password">
                      <el-input
                        v-model="passwordForm.new_password"
                        type="password"
                        placeholder="请输入新密码"
                        show-password
                      />
                    </el-form-item>
                    <el-form-item label="确认密码" prop="confirm_password">
                      <el-input
                        v-model="passwordForm.confirm_password"
                        type="password"
                        placeholder="请确认新密码"
                        show-password
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="changePassword" :loading="changingPassword">
                        修改密码
                      </el-button>
                    </el-form-item>
                  </el-form>
                </div>

                <!-- 两步验证 -->
                <div class="security-item">
                  <h4>两步验证</h4>
                  <div class="two-factor-section">
                    <div class="two-factor-status">
                      <el-tag :type="userInfo.two_factor_enabled ? 'success' : 'warning'">
                        {{ userInfo.two_factor_enabled ? '已启用' : '未启用' }}
                      </el-tag>
                      <span class="status-desc">
                        {{ userInfo.two_factor_enabled ? '您的账户已启用两步验证' : '启用两步验证可以提高账户安全性' }}
                      </span>
                    </div>
                    <el-button
                      :type="userInfo.two_factor_enabled ? 'danger' : 'primary'"
                      @click="toggleTwoFactor"
                    >
                      {{ userInfo.two_factor_enabled ? '禁用' : '启用' }}两步验证
                    </el-button>
                  </div>
                </div>

                <!-- 登录设备 -->
                <div class="security-item">
                  <h4>登录设备</h4>
                  <div class="devices-list">
                    <div v-for="device in loginDevices" :key="device.id" class="device-item">
                      <div class="device-info">
                        <div class="device-name">
                          <el-icon><Monitor /></el-icon>
                          {{ device.device_name }}
                        </div>
                        <div class="device-details">
                          <span>{{ device.location }}</span>
                          <span>{{ formatTime(device.last_active) }}</span>
                        </div>
                      </div>
                      <div class="device-actions">
                        <el-tag v-if="device.is_current" type="success" size="small">当前设备</el-tag>
                        <el-button v-else type="danger" size="small" @click="revokeDevice(device)">
                          移除
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 偏好设置 -->
            <el-tab-pane label="偏好设置" name="preferences">
              <el-form
                :model="preferencesForm"
                ref="preferencesFormRef"
                label-width="120px"
                class="settings-form"
              >
                <el-form-item label="界面主题">
                  <el-radio-group v-model="preferencesForm.theme">
                    <el-radio value="light">浅色主题</el-radio>
                    <el-radio value="dark">深色主题</el-radio>
                    <el-radio value="auto">跟随系统</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="语言设置">
                  <el-select v-model="preferencesForm.language" placeholder="选择语言">
                    <el-option label="简体中文" value="zh-cn" />
                    <el-option label="English" value="en" />
                    <el-option label="繁體中文" value="zh-tw" />
                  </el-select>
                </el-form-item>
                <el-form-item label="时区设置">
                  <el-select v-model="preferencesForm.timezone" placeholder="选择时区">
                    <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                    <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
                    <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                  </el-select>
                </el-form-item>
                <el-form-item label="邮件通知">
                  <el-checkbox-group v-model="preferencesForm.email_notifications">
                    <el-checkbox label="system">系统通知</el-checkbox>
                    <el-checkbox label="security">安全提醒</el-checkbox>
                    <el-checkbox label="updates">功能更新</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="搜索历史">
                  <el-switch
                    v-model="preferencesForm.save_search_history"
                    active-text="保存搜索历史"
                    inactive-text="不保存"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="savePreferences" :loading="saving">保存设置</el-button>
                  <el-button @click="resetPreferencesForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  DataAnalysis,
  Setting,
  Plus,
  Monitor,
  Search,
  Star,
  View,
  Clock
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const activeTab = ref('basic')
const saving = ref(false)
const changingPassword = ref(false)
const basicFormRef = ref()
const passwordFormRef = ref()
const preferencesFormRef = ref()

const userInfo = reactive({
  username: 'admin',
  email: 'admin@example.com',
  phone: '13800138000',
  real_name: '管理员',
  bio: '系统管理员',
  avatar: '',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  last_login: '2024-01-15T10:30:00Z',
  two_factor_enabled: false
})

const userStats = ref([
  {
    label: '搜索次数',
    value: '1,234',
    icon: 'Search',
    color: '#409eff'
  },
  {
    label: '收藏题目',
    value: '89',
    icon: 'Star',
    color: '#f56c6c'
  },
  {
    label: '浏览次数',
    value: '5,678',
    icon: 'View',
    color: '#67c23a'
  },
  {
    label: '在线时长',
    value: '156h',
    icon: 'Clock',
    color: '#e6a23c'
  }
])

const basicForm = reactive({
  username: '',
  email: '',
  phone: '',
  real_name: '',
  bio: ''
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const preferencesForm = reactive({
  theme: 'light',
  language: 'zh-cn',
  timezone: 'Asia/Shanghai',
  email_notifications: ['system', 'security'],
  save_search_history: true
})

const loginDevices = ref([
  {
    id: 1,
    device_name: 'Chrome on Windows',
    location: '北京市',
    last_active: '2024-01-15T10:30:00Z',
    is_current: true
  },
  {
    id: 2,
    device_name: 'Safari on iPhone',
    location: '上海市',
    last_active: '2024-01-14T15:20:00Z',
    is_current: false
  }
])

// 验证规则
const basicRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const passwordRules = {
  current_password: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.new_password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const handleAvatarSuccess = (response) => {
  userInfo.avatar = response.url
  ElMessage.success('头像上传成功')
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

const getRoleTagType = (role) => {
  const roleMap = {
    admin: 'danger',
    user: 'primary',
    guest: 'info'
  }
  return roleMap[role] || 'info'
}

const getRoleName = (role) => {
  const roleMap = {
    admin: '管理员',
    user: '普通用户',
    guest: '访客'
  }
  return roleMap[role] || role
}

const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

const saveBasicInfo = async () => {
  if (!basicFormRef.value) return
  
  try {
    const valid = await basicFormRef.value.validate()
    if (!valid) return
    
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新用户信息
    Object.assign(userInfo, basicForm)
    
    ElMessage.success('基本信息保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetBasicForm = () => {
  Object.assign(basicForm, {
    username: userInfo.username,
    email: userInfo.email,
    phone: userInfo.phone,
    real_name: userInfo.real_name,
    bio: userInfo.bio
  })
}

const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return
    
    changingPassword.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('密码修改成功')
    
    // 重置表单
    Object.assign(passwordForm, {
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    changingPassword.value = false
  }
}

const toggleTwoFactor = async () => {
  const action = userInfo.two_factor_enabled ? '禁用' : '启用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}两步验证吗？`, '提示', {
      type: 'info'
    })
    
    userInfo.two_factor_enabled = !userInfo.two_factor_enabled
    ElMessage.success(`两步验证已${action}`)
  } catch {
    // 用户取消
  }
}

const revokeDevice = async (device) => {
  try {
    await ElMessageBox.confirm(`确定要移除设备 "${device.device_name}" 吗？`, '提示', {
      type: 'warning'
    })
    
    const index = loginDevices.value.findIndex(d => d.id === device.id)
    if (index > -1) {
      loginDevices.value.splice(index, 1)
      ElMessage.success('设备已移除')
    }
  } catch {
    // 用户取消
  }
}

const savePreferences = async () => {
  saving.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 应用主题设置
    appStore.setTheme(preferencesForm.theme)
    appStore.setLanguage(preferencesForm.language)
    
    ElMessage.success('偏好设置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetPreferencesForm = () => {
  Object.assign(preferencesForm, {
    theme: 'light',
    language: 'zh-cn',
    timezone: 'Asia/Shanghai',
    email_notifications: ['system', 'security'],
    save_search_history: true
  })
}

// 生命周期
onMounted(() => {
  // 初始化表单数据
  resetBasicForm()
})
</script>

<style lang="scss" scoped>
.user-profile {
  padding: 20px;
}

.profile-card,
.stats-card,
.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-info {
  .avatar-section {
    text-align: center;
    margin-bottom: 30px;
    
    .avatar-uploader {
      .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
      }
      
      :deep(.el-upload) {
        border: 1px dashed #d9d9d9;
        border-radius: 50%;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.3s;
        width: 100px;
        height: 100px;
        
        &:hover {
          border-color: #409eff;
        }
      }
      
      .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 100px;
        height: 100px;
        line-height: 100px;
        text-align: center;
      }
    }
    
    .avatar-tip {
      margin-top: 10px;
      font-size: 12px;
      color: #909399;
    }
  }
  
  .user-details {
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .label {
        font-weight: 500;
        color: #606266;
      }
      
      .value {
        color: #303133;
      }
    }
  }
}

.stats-grid {
  .stat-item {
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      margin-right: 12px;
    }
    
    .stat-content {
      .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 4px;
      }
      
      .stat-label {
        color: #7f8c8d;
        font-size: 14px;
      }
    }
  }
}

.settings-tabs {
  :deep(.el-tabs__content) {
    padding-top: 20px;
  }
}

.settings-form {
  max-width: 600px;
}

.security-section {
  .security-item {
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    h4 {
      margin: 0 0 20px 0;
      color: #303133;
      font-weight: 500;
    }
    
    .two-factor-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .two-factor-status {
        .status-desc {
          margin-left: 12px;
          color: #909399;
          font-size: 14px;
        }
      }
    }
    
    .devices-list {
      .device-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        margin-bottom: 12px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .device-info {
          .device-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .device-details {
            font-size: 12px;
            color: #909399;
            
            span {
              margin-right: 12px;
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .user-profile {
    padding: 10px;
  }
  
  .two-factor-section {
    flex-direction: column !important;
    gap: 12px;
    align-items: flex-start !important;
  }
  
  .device-item {
    flex-direction: column !important;
    gap: 12px;
    align-items: flex-start !important;
  }
}
</style>
