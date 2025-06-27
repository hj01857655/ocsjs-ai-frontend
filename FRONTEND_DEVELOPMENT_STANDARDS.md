# 前端开发规范

## 📋 目录
- [项目概述](#项目概述)
- [技术栈规范](#技术栈规范)
- [代码规范](#代码规范)
- [组件规范](#组件规范)
- [API调用规范](#api调用规范)
- [样式规范](#样式规范)
- [性能优化规范](#性能优化规范)
- [测试规范](#测试规范)
- [部署规范](#部署规范)

## 🎯 项目概述

**项目名称**: EduBrain AI 智能题库系统前端  
**技术栈**: Vue 3 + Element Plus + Vite + Pinia  
**端口配置**: 前端开发服务器使用 8080 端口，后端API服务器使用 5000 端口  

## 🛠 技术栈规范

### 核心技术
- **框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 5+
- **UI组件库**: Element Plus 2.4+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **HTTP客户端**: Axios 1.6+

### 开发工具
- **包管理器**: npm (禁止混用yarn/pnpm)
- **代码格式化**: Prettier
- **代码检查**: ESLint
- **Git提交**: 遵循Conventional Commits规范

## 📝 代码规范

### 1. 文件命名
```
- 组件文件: PascalCase (UserProfile.vue)
- 页面文件: PascalCase (UserList.vue)
- 工具文件: camelCase (request.js)
- 常量文件: UPPER_SNAKE_CASE (API_CONSTANTS.js)
```

### 2. 变量命名
```javascript
// ✅ 正确
const userName = ref('')
const userList = reactive([])
const isLoading = ref(false)

// ❌ 错误
const user_name = ref('')
const UserList = reactive([])
const loading = ref(false)
```

### 3. 函数命名
```javascript
// ✅ 正确 - 动词开头，语义明确
const handleSubmit = () => {}
const getUserInfo = async () => {}
const validateForm = () => {}

// ❌ 错误
const submit = () => {}
const user = async () => {}
const validate = () => {}
```

## 🧩 组件规范

### 1. Element Plus 组件使用规范

#### ⚠️ 重要：Radio组件属性规范
```vue
<!-- ✅ 正确 - 使用 value 属性 -->
<el-radio-group v-model="selectedValue">
  <el-radio value="option1">选项1</el-radio>
  <el-radio value="option2">选项2</el-radio>
</el-radio-group>

<el-radio-group v-model="selectedValue">
  <el-radio-button value="all">全部</el-radio-button>
  <el-radio-button value="active">活跃</el-radio-button>
</el-radio-group>

<!-- ❌ 错误 - 禁止使用 label 属性 -->
<el-radio label="option1">选项1</el-radio>
<el-radio-button label="all">全部</el-radio-button>
```

**说明**: Element Plus 3.0.0 版本中，`label` 属性已被弃用，必须使用 `value` 属性。

### 2. 组件结构规范
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 1. 导入依赖
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 2. 定义props和emits
const props = defineProps({
  title: String,
  data: Array
})

const emit = defineEmits(['update', 'delete'])

// 3. 响应式数据
const loading = ref(false)
const formData = reactive({})

// 4. 计算属性
const filteredData = computed(() => {})

// 5. 方法定义
const handleSubmit = () => {}

// 6. 生命周期
onMounted(() => {})
</script>

<style scoped>
/* 样式内容 */
</style>
```

### 3. 组件通信规范
```javascript
// ✅ 正确 - 使用 defineProps 和 defineEmits
const props = defineProps({
  modelValue: String,
  options: Array
})

const emit = defineEmits(['update:modelValue', 'change'])

// ✅ 正确 - 事件命名使用 kebab-case
emit('update:modelValue', newValue)
emit('form-submit', formData)
```

## 🌐 API调用规范

### 1. 统一请求封装
```javascript
// ✅ 正确 - 使用统一的request工具
import { request } from '@/utils/request'

export function getUserList(params) {
  return request.get('/users', params)
}

export function createUser(data) {
  return request.post('/users', data)
}
```

### 2. 错误处理规范
```javascript
// ✅ 正确 - 统一错误处理
const handleSubmit = async () => {
  try {
    loading.value = true
    const response = await createUser(formData)
    ElMessage.success('创建成功')
    emit('success', response.data)
  } catch (error) {
    console.error('创建用户失败:', error)
    ElMessage.error(error.message || '创建失败')
  } finally {
    loading.value = false
  }
}
```

### 3. 接口地址规范
```javascript
// ✅ 正确 - 使用相对路径，通过代理转发
const API_BASE = '/api'

// ❌ 错误 - 硬编码完整URL
const API_BASE = 'http://localhost:5000/api'
```

## 🎨 样式规范

### 1. CSS类命名
```scss
// ✅ 正确 - BEM命名规范
.user-card {
  &__header {
    display: flex;
  }
  
  &__title {
    font-size: 16px;
  }
  
  &--active {
    border-color: #409eff;
  }
}
```

### 2. 响应式设计
```vue
<template>
  <el-row :gutter="20">
    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <!-- 内容 -->
    </el-col>
  </el-row>
</template>
```

### 3. 主题变量使用
```scss
// ✅ 正确 - 使用CSS变量
.custom-button {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
}

// ❌ 错误 - 硬编码颜色
.custom-button {
  background-color: #409eff;
  color: #ffffff;
}
```

## ⚡ 性能优化规范

### 1. 组件懒加载
```javascript
// ✅ 正确 - 路由懒加载
const routes = [
  {
    path: '/users',
    component: () => import('@/views/users/List.vue')
  }
]
```

### 2. 图片优化
```vue
<!-- ✅ 正确 - 使用适当的图片格式和尺寸 -->
<el-image
  :src="imageUrl"
  :lazy="true"
  fit="cover"
  :preview-src-list="[imageUrl]"
/>
```

### 3. 防抖节流
```javascript
// ✅ 正确 - 搜索输入防抖
import { debounce } from 'lodash-es'

const handleSearch = debounce((keyword) => {
  // 搜索逻辑
}, 300)
```

## 🧪 测试规范

### 1. 单元测试
```javascript
// 组件测试示例
import { mount } from '@vue/test-utils'
import UserCard from '@/components/UserCard.vue'

describe('UserCard', () => {
  it('should render user name correctly', () => {
    const wrapper = mount(UserCard, {
      props: { user: { name: 'John Doe' } }
    })
    expect(wrapper.text()).toContain('John Doe')
  })
})
```

## 🚀 部署规范

### 1. 环境配置
```javascript
// .env.development
VITE_API_BASE_URL=http://localhost:5000/api

// .env.production  
VITE_API_BASE_URL=/api
```

### 2. 构建优化
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          elementPlus: ['element-plus']
        }
      }
    }
  }
})
```

## 📋 检查清单

### 代码提交前检查
- [ ] 所有 `el-radio` 和 `el-radio-button` 使用 `value` 属性而非 `label`
- [ ] API调用使用统一的request工具
- [ ] 组件命名遵循PascalCase
- [ ] 变量命名遵循camelCase
- [ ] 错误处理完整
- [ ] 响应式设计适配
- [ ] 无console.log残留
- [ ] ESLint检查通过
- [ ] 功能测试通过

### 性能检查
- [ ] 图片已优化
- [ ] 组件懒加载
- [ ] 防抖节流应用
- [ ] 无内存泄漏
- [ ] 打包体积合理

---

**最后更新**: 2025-01-25  
**版本**: v1.0.0  
**维护者**: 开发团队

> ⚠️ **重要提醒**: 此规范为强制性规范，所有开发人员必须严格遵循。违反规范的代码将不被接受合并。
