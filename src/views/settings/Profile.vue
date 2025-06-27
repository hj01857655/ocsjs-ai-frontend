<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人设置</span>
        </div>
      </template>
      
      <el-form :model="profileForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        
        <el-form-item label="邮箱">
          <el-input v-model="profileForm.email" />
        </el-form-item>
        
        <el-form-item label="真实姓名">
          <el-input v-model="profileForm.realName" />
        </el-form-item>
        
        <el-form-item label="个人简介">
          <el-input 
            v-model="profileForm.bio" 
            type="textarea" 
            :rows="4"
            placeholder="请输入个人简介"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveProfile">保存设置</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const profileForm = ref({
  username: '',
  email: '',
  realName: '',
  bio: ''
})

const loadProfile = async () => {
  // 模拟加载用户信息
  profileForm.value = {
    username: 'admin',
    email: 'admin@example.com',
    realName: '管理员',
    bio: '系统管理员账户'
  }
}

const saveProfile = async () => {
  try {
    // 这里应该调用API保存用户信息
    ElMessage.success('个人信息保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

const resetForm = () => {
  loadProfile()
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
