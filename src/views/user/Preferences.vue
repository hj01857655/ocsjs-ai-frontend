<template>
  <div class="user-preferences">
    <el-row :gutter="20">
      <!-- 界面设置 -->
      <el-col :xs="24" :lg="12">
        <el-card class="preference-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>界面设置</span>
            </div>
          </template>

          <div class="preference-section">
            <div class="preference-item">
              <div class="item-header">
                <h4>主题模式</h4>
                <p>选择您喜欢的界面主题</p>
              </div>
              <div class="theme-options">
                <div
                  v-for="theme in themeOptions"
                  :key="theme.value"
                  class="theme-option"
                  :class="{ 'active': preferences.theme === theme.value }"
                  @click="setTheme(theme.value)"
                >
                  <div class="theme-preview" :class="`theme-${theme.value}`">
                    <div class="preview-header"></div>
                    <div class="preview-sidebar"></div>
                    <div class="preview-content"></div>
                  </div>
                  <div class="theme-name">{{ theme.name }}</div>
                </div>
              </div>
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>语言设置</h4>
                <p>选择界面显示语言</p>
              </div>
              <el-select v-model="preferences.language" @change="setLanguage">
                <el-option
                  v-for="lang in languageOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                >
                  <span class="language-flag">{{ lang.flag }}</span>
                  <span>{{ lang.label }}</span>
                </el-option>
              </el-select>
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>字体大小</h4>
                <p>调整界面字体大小</p>
              </div>
              <el-radio-group v-model="preferences.fontSize" @change="setFontSize">
                <el-radio value="small">小</el-radio>
                <el-radio value="default">默认</el-radio>
                <el-radio value="large">大</el-radio>
              </el-radio-group>
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>侧边栏</h4>
                <p>设置侧边栏默认状态</p>
              </div>
              <el-switch
                v-model="preferences.sidebarCollapsed"
                active-text="默认收起"
                inactive-text="默认展开"
                @change="setSidebarCollapsed"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 搜索设置 -->
      <el-col :xs="24" :lg="12">
        <el-card class="preference-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Search /></el-icon>
              <span>搜索设置</span>
            </div>
          </template>

          <div class="preference-section">
            <div class="preference-item">
              <div class="item-header">
                <h4>搜索历史</h4>
                <p>是否保存搜索历史记录</p>
              </div>
              <el-switch
                v-model="preferences.saveSearchHistory"
                active-text="保存"
                inactive-text="不保存"
                @change="savePreference('saveSearchHistory')"
              />
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>搜索建议</h4>
                <p>输入时显示搜索建议</p>
              </div>
              <el-switch
                v-model="preferences.showSearchSuggestions"
                active-text="显示"
                inactive-text="隐藏"
                @change="savePreference('showSearchSuggestions')"
              />
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>默认搜索策略</h4>
                <p>选择默认的搜索策略</p>
              </div>
              <el-select v-model="preferences.defaultSearchStrategy" @change="savePreference('defaultSearchStrategy')">
                <el-option label="最快响应" value="first_success" />
                <el-option label="最佳响应" value="best_response" />
                <el-option label="多数投票" value="majority_vote" />
              </el-select>
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>搜索超时时间</h4>
                <p>设置搜索请求的超时时间（秒）</p>
              </div>
              <el-slider
                v-model="preferences.searchTimeout"
                :min="5"
                :max="60"
                :step="5"
                show-stops
                show-input
                @change="savePreference('searchTimeout')"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 通知设置 -->
    <el-card class="preference-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Bell /></el-icon>
          <span>通知设置</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <div class="preference-section">
            <div class="preference-item">
              <div class="item-header">
                <h4>邮件通知</h4>
                <p>选择您希望接收的邮件通知类型</p>
              </div>
              <el-checkbox-group v-model="preferences.emailNotifications" @change="savePreference('emailNotifications')">
                <el-checkbox label="system">系统通知</el-checkbox>
                <el-checkbox label="security">安全提醒</el-checkbox>
                <el-checkbox label="updates">功能更新</el-checkbox>
                <el-checkbox label="marketing">营销信息</el-checkbox>
              </el-checkbox-group>
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>浏览器通知</h4>
                <p>允许浏览器推送通知</p>
              </div>
              <el-switch
                v-model="preferences.browserNotifications"
                active-text="允许"
                inactive-text="禁止"
                @change="toggleBrowserNotifications"
              />
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="12">
          <div class="preference-section">
            <div class="preference-item">
              <div class="item-header">
                <h4>通知声音</h4>
                <p>新通知时播放提示音</p>
              </div>
              <el-switch
                v-model="preferences.notificationSound"
                active-text="开启"
                inactive-text="关闭"
                @change="savePreference('notificationSound')"
              />
            </div>

            <div class="preference-item">
              <div class="item-header">
                <h4>免打扰时间</h4>
                <p>设置免打扰时间段</p>
              </div>
              <el-time-picker
                v-model="preferences.quietHours"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="HH:mm"
                value-format="HH:mm"
                @change="savePreference('quietHours')"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 隐私设置 -->
    <el-card class="preference-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Lock /></el-icon>
          <span>隐私设置</span>
        </div>
      </template>

      <div class="preference-section">
        <div class="preference-item">
          <div class="item-header">
            <h4>数据收集</h4>
            <p>允许收集使用数据以改善服务</p>
          </div>
          <el-switch
            v-model="preferences.allowDataCollection"
            active-text="允许"
            inactive-text="禁止"
            @change="savePreference('allowDataCollection')"
          />
        </div>

        <div class="preference-item">
          <div class="item-header">
            <h4>错误报告</h4>
            <p>自动发送错误报告帮助改进产品</p>
          </div>
          <el-switch
            v-model="preferences.sendErrorReports"
            active-text="发送"
            inactive-text="不发送"
            @change="savePreference('sendErrorReports')"
          />
        </div>

        <div class="preference-item">
          <div class="item-header">
            <h4>Cookie设置</h4>
            <p>管理Cookie使用偏好</p>
          </div>
          <el-radio-group v-model="preferences.cookiePreference" @change="savePreference('cookiePreference')">
            <el-radio value="all">接受所有Cookie</el-radio>
            <el-radio value="necessary">仅必要Cookie</el-radio>
            <el-radio value="none">拒绝所有Cookie</el-radio>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <el-button type="primary" @click="saveAllPreferences" :loading="saving">
        <el-icon><Check /></el-icon>
        保存所有设置
      </el-button>
      <el-button @click="resetToDefaults">
        <el-icon><RefreshRight /></el-icon>
        恢复默认设置
      </el-button>
      <el-button type="danger" @click="clearAllData">
        <el-icon><Delete /></el-icon>
        清除所有数据
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor,
  Search,
  Bell,
  Lock,
  Check,
  RefreshRight,
  Delete
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// 响应式数据
const saving = ref(false)

const preferences = reactive({
  // 界面设置
  theme: 'light',
  language: 'zh-cn',
  fontSize: 'default',
  sidebarCollapsed: false,

  // 搜索设置
  saveSearchHistory: true,
  showSearchSuggestions: true,
  defaultSearchStrategy: 'first_success',
  searchTimeout: 30,

  // 通知设置
  emailNotifications: ['system', 'security'],
  browserNotifications: false,
  notificationSound: true,
  quietHours: ['22:00', '08:00'],

  // 隐私设置
  allowDataCollection: true,
  sendErrorReports: true,
  cookiePreference: 'necessary'
})

const themeOptions = [
  { name: '浅色', value: 'light' },
  { name: '深色', value: 'dark' },
  { name: '自动', value: 'auto' }
]

const languageOptions = [
  { label: '简体中文', value: 'zh-cn', flag: '🇨🇳' },
  { label: 'English', value: 'en', flag: '🇺🇸' },
  { label: '繁體中文', value: 'zh-tw', flag: '🇹🇼' },
  { label: '日本語', value: 'ja', flag: '🇯🇵' }
]

// 方法
const setTheme = (theme) => {
  preferences.theme = theme
  appStore.setTheme(theme)
  savePreference('theme')
}

const setLanguage = (language) => {
  appStore.setLanguage(language)
  savePreference('language')
}

const setFontSize = (size) => {
  appStore.setSize(size)
  savePreference('fontSize')
}

const setSidebarCollapsed = (collapsed) => {
  if (collapsed) {
    appStore.closeSidebar()
  } else {
    appStore.toggleSidebar()
  }
  savePreference('sidebarCollapsed')
}

const toggleBrowserNotifications = async () => {
  if (preferences.browserNotifications) {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        preferences.browserNotifications = false
        ElMessage.warning('浏览器通知权限被拒绝')
        return
      }
      ElMessage.success('浏览器通知已启用')
    } catch (error) {
      preferences.browserNotifications = false
      ElMessage.error('启用浏览器通知失败')
      return
    }
  }
  savePreference('browserNotifications')
}

const savePreference = async (key) => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))

    // 保存到localStorage
    localStorage.setItem(`preference_${key}`, JSON.stringify(preferences[key]))

    console.log(`偏好设置 ${key} 已保存:`, preferences[key])
  } catch (error) {
    ElMessage.error('保存设置失败')
  }
}

const saveAllPreferences = async () => {
  saving.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 保存所有设置到localStorage
    Object.keys(preferences).forEach(key => {
      localStorage.setItem(`preference_${key}`, JSON.stringify(preferences[key]))
    })

    ElMessage.success('所有设置已保存')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

const resetToDefaults = async () => {
  try {
    await ElMessageBox.confirm('确定要恢复所有默认设置吗？当前设置将会丢失。', '提示', {
      type: 'warning'
    })

    // 恢复默认设置
    Object.assign(preferences, {
      theme: 'light',
      language: 'zh-cn',
      fontSize: 'default',
      sidebarCollapsed: false,
      saveSearchHistory: true,
      showSearchSuggestions: true,
      defaultSearchStrategy: 'first_success',
      searchTimeout: 30,
      emailNotifications: ['system', 'security'],
      browserNotifications: false,
      notificationSound: true,
      quietHours: ['22:00', '08:00'],
      allowDataCollection: true,
      sendErrorReports: true,
      cookiePreference: 'necessary'
    })

    // 应用设置
    appStore.setTheme(preferences.theme)
    appStore.setLanguage(preferences.language)
    appStore.setSize(preferences.fontSize)

    // 清除localStorage中的偏好设置
    Object.keys(preferences).forEach(key => {
      localStorage.removeItem(`preference_${key}`)
    })

    ElMessage.success('已恢复默认设置')
  } catch {
    // 用户取消
  }
}

const clearAllData = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有数据吗？这将删除您的所有设置、搜索历史等数据，此操作不可恢复！', '警告', {
      type: 'error',
      confirmButtonText: '确定清除',
      cancelButtonText: '取消'
    })

    // 清除所有相关数据
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('preference_') || key.startsWith('search_') || key.startsWith('app_'))) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    ElMessage.success('所有数据已清除')

    // 刷新页面
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch {
    // 用户取消
  }
}

const loadPreferences = () => {
  // 从localStorage加载偏好设置
  Object.keys(preferences).forEach(key => {
    const saved = localStorage.getItem(`preference_${key}`)
    if (saved) {
      try {
        preferences[key] = JSON.parse(saved)
      } catch (error) {
        console.warn(`Failed to parse preference ${key}:`, error)
      }
    }
  })

  // 应用设置到store
  appStore.setTheme(preferences.theme)
  appStore.setLanguage(preferences.language)
  appStore.setSize(preferences.fontSize)
}

// 生命周期
onMounted(() => {
  loadPreferences()
})
</script>

<style lang="scss" scoped>
.user-preferences {
  padding: 20px;
}

.preference-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preference-section {
  .preference-item {
    margin-bottom: 30px;

    &:last-child {
      margin-bottom: 0;
    }

    .item-header {
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px 0;
        color: #303133;
        font-weight: 500;
      }

      p {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
  }
}

.theme-options {
  display: flex;
  gap: 16px;

  .theme-option {
    cursor: pointer;
    text-align: center;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
    }

    &.active {
      .theme-preview {
        border-color: #409eff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }
    }

    .theme-preview {
      width: 80px;
      height: 60px;
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      margin-bottom: 8px;
      transition: all 0.3s;

      &.theme-light {
        background: #ffffff;

        .preview-header {
          background: #f5f7fa;
        }

        .preview-sidebar {
          background: #e4e7ed;
        }

        .preview-content {
          background: #ffffff;
        }
      }

      &.theme-dark {
        background: #2c3e50;

        .preview-header {
          background: #34495e;
        }

        .preview-sidebar {
          background: #1a252f;
        }

        .preview-content {
          background: #2c3e50;
        }
      }

      &.theme-auto {
        background: linear-gradient(45deg, #ffffff 50%, #2c3e50 50%);

        .preview-header {
          background: linear-gradient(45deg, #f5f7fa 50%, #34495e 50%);
        }

        .preview-sidebar {
          background: linear-gradient(45deg, #e4e7ed 50%, #1a252f 50%);
        }

        .preview-content {
          background: linear-gradient(45deg, #ffffff 50%, #2c3e50 50%);
        }
      }

      .preview-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 12px;
      }

      .preview-sidebar {
        position: absolute;
        top: 12px;
        left: 0;
        bottom: 0;
        width: 20px;
      }

      .preview-content {
        position: absolute;
        top: 12px;
        left: 20px;
        right: 0;
        bottom: 0;
      }
    }

    .theme-name {
      font-size: 12px;
      color: #606266;
    }
  }
}

.language-flag {
  margin-right: 8px;
}

.actions-section {
  margin-top: 30px;
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;

  .el-button {
    margin: 0 8px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .user-preferences {
    padding: 10px;
  }

  .theme-options {
    justify-content: center;
    flex-wrap: wrap;
  }

  .actions-section {
    .el-button {
      display: block;
      width: 100%;
      margin: 8px 0;
    }
  }
}
</style>
