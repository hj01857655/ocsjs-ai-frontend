<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="login-header">
        <div class="logo">
          <img src="@/assets/logo.svg" alt="EduBrain AI" />
        </div>
        <h1 class="title">EduBrain AI</h1>
        <p class="subtitle">智能题库系统</p>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on"
        label-position="left">
        <el-form-item prop="username">
          <span class="svg-container">
            <el-icon>
              <User />
            </el-icon>
          </span>
          <el-input ref="username" v-model="loginForm.username" placeholder="用户名" name="username" type="text"
            tabindex="1" auto-complete="on" clearable />
        </el-form-item>

        <el-form-item prop="password">
          <span class="svg-container">
            <el-icon>
              <Lock />
            </el-icon>
          </span>
          <el-input :key="passwordType" ref="password" v-model="loginForm.password" :type="passwordType"
            placeholder="密码" name="password" tabindex="2" auto-complete="on" @keyup.enter="handleLogin" />
          <span class="show-pwd" @click="showPwd">
            <el-icon>
              <View v-if="passwordType === 'password'" />
              <Hide v-else />
            </el-icon>
          </span>
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <el-link type="primary" @click="showForgotPassword">忘记密码？</el-link>
        </div>

        <el-button :loading="loading" type="primary" style="width: 100%; margin-bottom: 30px;"
          @click.prevent="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </el-button>

        <div class="register-link">
          还没有账号？
          <el-link type="primary" @click="showRegister">立即注册</el-link>
        </div>
      </el-form>
    </div>

    <!-- 背景装饰 -->
    <div class="login-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 忘记密码对话框 -->
    <el-dialog v-model="forgotPasswordVisible" title="忘记密码" width="400px">
      <el-form :model="forgotPasswordForm" :rules="forgotPasswordRules" ref="forgotPasswordFormRef">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="forgotPasswordForm.email" placeholder="请输入注册邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="handleForgotPassword">发送重置邮件</el-button>
      </template>
    </el-dialog>

    <!-- 注册对话框 -->
    <el-dialog v-model="registerVisible" title="用户注册" width="500px">
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRegister">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { validEmail } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const loginFormRef = ref()
const forgotPasswordFormRef = ref()
const registerFormRef = ref()
const username = ref()
const password = ref()

const passwordType = ref('password')
const loading = ref(false)
const forgotPasswordVisible = ref(false)
const registerVisible = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456',
  rememberMe: true
})

const forgotPasswordForm = reactive({
  email: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 验证规则
const validateUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3) {
    callback(new Error('用户名至少3个字符'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码至少6个字符'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const loginRules = {
  username: [{ required: true, trigger: 'blur', validator: validateUsername }],
  password: [{ required: true, trigger: 'blur', validator: validatePassword }]
}

const forgotPasswordRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validEmail(value)) {
          callback(new Error('请输入正确的邮箱格式'))
        } else {
          callback()
        }
      }, trigger: 'blur'
    }
  ]
}

const registerRules = {
  username: [{ required: true, trigger: 'blur', validator: validateUsername }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validEmail(value)) {
          callback(new Error('请输入正确的邮箱格式'))
        } else {
          callback()
        }
      }, trigger: 'blur'
    }
  ],
  password: [{ required: true, trigger: 'blur', validator: validatePassword }],
  confirmPassword: [{ required: true, trigger: 'blur', validator: validateConfirmPassword }]
}

// 方法
const showPwd = () => {
  if (passwordType.value === 'password') {
    passwordType.value = ''
  } else {
    passwordType.value = 'password'
  }
  nextTick(() => {
    password.value.focus()
  })
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true

    await userStore.userLogin(loginForm)

    // 确保用户信息已加载
    if (!userStore.userInfo.id) {
      await userStore.getUserInfo()
    }

    // 登录成功后跳转
    const redirect = route.query.redirect || '/dashboard'
    await router.push(redirect)

  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

const showForgotPassword = () => {
  forgotPasswordVisible.value = true
}

const handleForgotPassword = async () => {
  if (!forgotPasswordFormRef.value) return

  try {
    const valid = await forgotPasswordFormRef.value.validate()
    if (!valid) return

    // 这里调用忘记密码API
    ElMessage.success('重置邮件已发送，请查收邮箱')
    forgotPasswordVisible.value = false
  } catch (error) {
    console.error('发送重置邮件失败:', error)
  }
}

const showRegister = () => {
  registerVisible.value = true
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    const valid = await registerFormRef.value.validate()
    if (!valid) return

    // 这里调用注册API
    ElMessage.success('注册成功，请登录')
    registerVisible.value = false
  } catch (error) {
    console.error('注册失败:', error)
  }
}

// 生命周期
onMounted(() => {
  if (loginForm.username === '') {
    username.value.focus()
  } else if (loginForm.password === '') {
    password.value.focus()
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.login-form-wrapper {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .logo {
    margin-bottom: 20px;

    img {
      width: 60px;
      height: 60px;
    }
  }

  .title {
    font-size: 28px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 10px 0;
  }

  .subtitle {
    color: #7f8c8d;
    font-size: 14px;
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    border: 1px solid #dcdfe6;
    background: #fff;
    border-radius: 8px;
    color: #454545;
    margin-bottom: 20px;
    position: relative;

    &:hover {
      border-color: #c0c4cc;
    }

    &.is-error {
      border-color: #f56c6c;
    }
  }

  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    :deep(.el-input__wrapper) {
      box-shadow: none;
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 12px 5px 12px 15px;
    }

    :deep(.el-input__inner) {
      background: transparent;
      border: 0px;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: #454545;
      height: 47px;
      caret-color: #454545;
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: #889aa4;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: #889aa4;
    cursor: pointer;
    user-select: none;
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.register-link {
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;

  .shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;

    &.shape-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    &.shape-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 10%;
      animation-delay: 2s;
    }

    &.shape-3 {
      width: 100px;
      height: 100px;
      bottom: 20%;
      left: 20%;
      animation-delay: 4s;
    }
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-20px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-form-wrapper {
    width: 90%;
    padding: 30px 20px;
    margin: 20px;
  }
}
</style>
