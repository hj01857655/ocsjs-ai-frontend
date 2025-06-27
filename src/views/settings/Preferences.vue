<template>
  <div class="preferences-container">
    <el-card class="preferences-card">
      <template #header>
        <div class="card-header">
          <span>偏好设置</span>
        </div>
      </template>
      
      <el-form :model="preferencesForm" label-width="120px">
        <el-form-item label="主题设置">
          <el-radio-group v-model="preferencesForm.theme">
            <el-radio value="light">浅色主题</el-radio>
            <el-radio value="dark">深色主题</el-radio>
            <el-radio value="auto">跟随系统</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="语言设置">
          <el-select v-model="preferencesForm.language" placeholder="请选择语言">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="每页显示数量">
          <el-select v-model="preferencesForm.pageSize" placeholder="请选择">
            <el-option label="10条" :value="10" />
            <el-option label="20条" :value="20" />
            <el-option label="50条" :value="50" />
            <el-option label="100条" :value="100" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="自动保存">
          <el-switch v-model="preferencesForm.autoSave" />
        </el-form-item>
        
        <el-form-item label="消息通知">
          <el-switch v-model="preferencesForm.notifications" />
        </el-form-item>
        
        <el-form-item label="搜索历史">
          <el-switch v-model="preferencesForm.saveSearchHistory" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="savePreferences">保存设置</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const preferencesForm = ref({
  theme: 'light',
  language: 'zh-CN',
  pageSize: 20,
  autoSave: true,
  notifications: true,
  saveSearchHistory: true
})

const loadPreferences = async () => {
  // 模拟加载用户偏好设置
  const saved = localStorage.getItem('userPreferences')
  if (saved) {
    try {
      const preferences = JSON.parse(saved)
      preferencesForm.value = { ...preferencesForm.value, ...preferences }
    } catch (error) {
      console.error('加载偏好设置失败:', error)
    }
  }
}

const savePreferences = async () => {
  try {
    // 保存到本地存储
    localStorage.setItem('userPreferences', JSON.stringify(preferencesForm.value))
    
    // 这里应该调用API保存到服务器
    ElMessage.success('偏好设置保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

const resetForm = () => {
  preferencesForm.value = {
    theme: 'light',
    language: 'zh-CN',
    pageSize: 20,
    autoSave: true,
    notifications: true,
    saveSearchHistory: true
  }
}

onMounted(() => {
  loadPreferences()
})
</script>

<style scoped>
.preferences-container {
  padding: 20px;
}

.preferences-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
