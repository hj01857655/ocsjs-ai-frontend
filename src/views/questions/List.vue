<template>
  <div class="questions-list">
    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="hover">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索题目内容..."
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="searchForm.type" placeholder="选择题型" clearable style="width: 120px">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judgement" />
            <el-option label="填空题" value="completion" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="searchForm.difficulty" placeholder="选择难度" clearable style="width: 120px">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="收藏">
          <el-select v-model="searchForm.favorite" placeholder="收藏状态" clearable style="width: 120px">
            <el-option label="已收藏" :value="true" />
            <el-option label="未收藏" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleReset" :icon="RefreshRight">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="toolbar-card" shadow="hover">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="showAddDialog" :icon="Plus">添加题目</el-button>
          <el-button type="success" @click="showImportDialog" :icon="Upload">批量导入</el-button>
          <el-button type="warning" @click="handleExport" :icon="Download">导出数据</el-button>
          <el-button 
            type="danger" 
            @click="handleBatchDelete" 
            :disabled="!selectedRows.length"
            :icon="Delete"
          >
            批量删除 ({{ selectedRows.length }})
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新数据">
            <el-button @click="loadData" :icon="Refresh" circle />
          </el-tooltip>
          <el-tooltip content="列设置">
            <el-button @click="showColumnSettings" :icon="Setting" circle />
          </el-tooltip>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <el-table
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable="custom" />
        <el-table-column prop="question" label="题目内容" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="question-content">
              <div class="question-text">{{ row.question }}</div>
              <div v-if="row.options" class="question-options">
                <el-tag v-for="(option, index) in parseOptions(row.options)" :key="index" size="small">
                  {{ option }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="answer" label="答案" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text class="answer-text" truncated>{{ row.answer }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="题型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag :type="getDifficultyTagType(row.difficulty)">{{ getDifficultyName(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="查看次数" width="100" sortable="custom" />
        <el-table-column prop="is_favorite" label="收藏" width="80">
          <template #default="{ row }">
            <el-icon 
              :class="{ 'favorite-active': row.is_favorite }" 
              class="favorite-icon"
              @click="toggleFavorite(row)"
            >
              <Star />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" sortable="custom">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewQuestion(row)" :icon="View">查看</el-button>
            <el-button type="warning" size="small" @click="editQuestion(row)" :icon="Edit">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteQuestion(row)" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 题目详情对话框 -->
    <el-dialog v-model="detailVisible" title="题目详情" width="800px">
      <div v-if="currentQuestion" class="question-detail">
        <div class="detail-section">
          <h4>题目内容</h4>
          <div class="detail-content">{{ currentQuestion.question }}</div>
        </div>
        <div v-if="currentQuestion.options" class="detail-section">
          <h4>选项</h4>
          <div class="detail-content">
            <div v-for="(option, index) in parseOptions(currentQuestion.options)" :key="index" class="option-item">
              {{ option }}
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4>答案</h4>
          <div class="detail-content answer-content">{{ currentQuestion.answer }}</div>
        </div>
        <div class="detail-section">
          <h4>题目信息</h4>
          <div class="detail-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="题型">
                <el-tag :type="getTypeTagType(currentQuestion.type)">{{ getTypeName(currentQuestion.type) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="难度">
                <el-tag :type="getDifficultyTagType(currentQuestion.difficulty)">{{ getDifficultyName(currentQuestion.difficulty) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="查看次数">{{ currentQuestion.view_count || 0 }}</el-descriptions-item>
              <el-descriptions-item label="收藏状态">
                <el-tag :type="currentQuestion.is_favorite ? 'success' : 'info'">
                  {{ currentQuestion.is_favorite ? '已收藏' : '未收藏' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatTime(currentQuestion.created_at) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatTime(currentQuestion.updated_at) }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 添加题目对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="editingQuestionId ? '编辑题目' : '添加题目'"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="100px"
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="题目内容" prop="question">
              <el-input
                v-model="addForm.question"
                type="textarea"
                :rows="3"
                placeholder="请输入题目内容"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="题目类型" prop="type">
              <el-select v-model="addForm.type" placeholder="选择题目类型" style="width: 100%">
                <el-option label="单选题" value="single" />
                <el-option label="多选题" value="multiple" />
                <el-option label="判断题" value="judgement" />
                <el-option label="填空题" value="completion" />
                <el-option label="问答题" value="essay" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度等级" prop="difficulty">
              <el-select v-model="addForm.difficulty" placeholder="选择难度等级" style="width: 100%">
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="题目来源">
              <el-input v-model="addForm.source" placeholder="题目来源" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="['single', 'multiple'].includes(addForm.type)">
          <el-col :span="24">
            <el-form-item label="选项内容" prop="options">
              <el-input
                v-model="addForm.options"
                type="textarea"
                :rows="4"
                placeholder="请输入选项内容，每行一个选项，格式如：&#10;A. 选项1&#10;B. 选项2&#10;C. 选项3&#10;D. 选项4"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="答案内容" prop="answer">
              <el-input
                v-model="addForm.answer"
                type="textarea"
                :rows="3"
                placeholder="请输入答案内容"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="标签">
              <el-input
                v-model="addForm.tags"
                placeholder="请输入标签，多个标签用逗号分隔"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddSubmit" :loading="addLoading">
            {{ editingQuestionId ? '确定修改' : '确定添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 智能导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="智能导入题目"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="import-tips">
        <el-alert
          title="导入格式说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>支持以下格式：</p>
            <ul>
              <li>1. 题目内容</li>
              <li>A. 选项A</li>
              <li>B. 选项B</li>
              <li>C. 选项C</li>
              <li>D. 选项D</li>
              <li>答案：A</li>
              <li>解析：解析内容（可选）</li>
            </ul>
          </template>
        </el-alert>
      </div>

      <el-form label-width="100px" style="margin-top: 20px;">
        <el-form-item label="导入内容">
          <el-input
            v-model="importContent"
            type="textarea"
            :rows="12"
            placeholder="请粘贴题目内容，支持批量导入多道题目"
            maxlength="10000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleImportSubmit" :loading="importLoading">
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Upload,
  Download,
  Delete,
  Refresh,
  Setting,
  View,
  Edit,
  Star
} from '@element-plus/icons-vue'
import {
  getQuestions,
  deleteQuestion as deleteQuestionApi,
  batchDeleteQuestions,
  favoriteQuestion,
  unfavoriteQuestion,
  addQuestion,
  updateQuestion,
  exportQuestions,
  smartImportQuestions
} from '@/api/questions'

// 响应式数据
const loading = ref(false)
const detailVisible = ref(false)
const addDialogVisible = ref(false)
const addLoading = ref(false)
const selectedRows = ref([])
const currentQuestion = ref(null)
const addFormRef = ref(null)
const editingQuestionId = ref(null)
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importContent = ref('')

const searchForm = reactive({
  keyword: '',
  type: '',
  difficulty: '',
  favorite: null
})

const addForm = reactive({
  question: '',
  type: '',
  options: '',
  answer: '',
  difficulty: 'medium',
  tags: '',
  source: '手动添加'
})

const addFormRules = reactive({
  question: [
    { required: true, message: '请输入题目内容', trigger: 'blur' },
    { min: 5, message: '题目内容至少5个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ],
  answer: [
    { required: true, message: '请输入答案内容', trigger: 'blur' }
  ],
  options: [
    {
      validator: (rule, value, callback) => {
        if (['single', 'multiple'].includes(addForm.type) && !value.trim()) {
          callback(new Error('选择题必须填写选项内容'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const tableData = ref([])

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword,
      type: searchForm.type,
      difficulty: searchForm.difficulty,
      favorite: searchForm.favorite
    }

    const response = await getQuestions(params)
    if (response.success) {
      tableData.value = response.data.questions
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.message || '加载数据失败')
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    type: '',
    difficulty: '',
    favorite: null
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSortChange = ({ prop, order }) => {
  console.log('排序变化:', prop, order)
  loadData()
}

const handlePageChange = () => {
  loadData()
}

const handleSizeChange = () => {
  pagination.page = 1
  loadData()
}

const viewQuestion = (row) => {
  currentQuestion.value = row
  detailVisible.value = true
}

const editQuestion = (row) => {
  // 填充表单数据
  Object.assign(addForm, {
    question: row.question,
    type: row.type,
    options: row.options || '',
    answer: row.answer,
    difficulty: row.difficulty,
    tags: Array.isArray(row.tags) ? row.tags.join(', ') : (row.tags || ''),
    source: row.source || '手动添加'
  })

  // 设置编辑模式
  editingQuestionId.value = row.id
  addDialogVisible.value = true
}

const deleteQuestion = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这道题目吗？', '提示', {
      type: 'warning'
    })

    const response = await deleteQuestionApi(row.id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const toggleFavorite = async (row) => {
  try {
    const response = row.is_favorite
      ? await unfavoriteQuestion(row.id)
      : await favoriteQuestion(row.id)

    if (response.success) {
      row.is_favorite = !row.is_favorite
      ElMessage.success(row.is_favorite ? '已收藏' : '已取消收藏')
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的题目')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 道题目吗？`, '提示', {
      type: 'warning'
    })

    const questionIds = selectedRows.value.map(row => row.id)
    const response = await batchDeleteQuestions(questionIds)

    if (response.success) {
      ElMessage.success(response.message)
      selectedRows.value = []
      loadData()
    } else {
      ElMessage.error(response.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

const showAddDialog = () => {
  // 重置表单
  Object.assign(addForm, {
    question: '',
    type: '',
    options: '',
    answer: '',
    difficulty: 'medium',
    tags: '',
    source: '手动添加'
  })

  // 清除编辑状态
  editingQuestionId.value = null

  // 清除验证
  if (addFormRef.value) {
    addFormRef.value.clearValidate()
  }

  addDialogVisible.value = true
}

const handleDialogClose = () => {
  editingQuestionId.value = null
}

const handleAddSubmit = async () => {
  if (!addFormRef.value) return

  try {
    // 表单验证
    await addFormRef.value.validate()

    addLoading.value = true

    // 准备提交数据
    const submitData = {
      question: addForm.question.trim(),
      type: addForm.type,
      answer: addForm.answer.trim(),
      difficulty: addForm.difficulty,
      source: addForm.source || '手动添加'
    }

    // 处理选项
    if (['single', 'multiple'].includes(addForm.type)) {
      submitData.options = addForm.options.trim()
    }

    // 处理标签
    if (addForm.tags.trim()) {
      submitData.tags = addForm.tags.trim()
    }

    // 调用API
    let response
    if (editingQuestionId.value) {
      // 编辑模式
      response = await updateQuestion(editingQuestionId.value, submitData)
    } else {
      // 添加模式
      response = await addQuestion(submitData)
    }

    if (response.success) {
      ElMessage.success(editingQuestionId.value ? '题目修改成功' : '题目添加成功')
      addDialogVisible.value = false
      loadData() // 重新加载列表
    } else {
      ElMessage.error(response.message || (editingQuestionId.value ? '修改失败' : '添加失败'))
    }

  } catch (error) {
    if (error !== 'validation failed') {
      console.error('添加题目失败:', error)
      ElMessage.error('添加题目失败')
    }
  } finally {
    addLoading.value = false
  }
}

const showImportDialog = () => {
  importContent.value = ''
  importDialogVisible.value = true
}

const handleImportSubmit = async () => {
  if (!importContent.value.trim()) {
    ElMessage.warning('请输入要导入的内容')
    return
  }

  importLoading.value = true
  try {
    const response = await smartImportQuestions(importContent.value.trim())

    if (response.success) {
      const { imported_count, skipped_count } = response.data
      ElMessage.success(`导入完成！成功导入 ${imported_count} 道题目，跳过 ${skipped_count} 道`)
      importDialogVisible.value = false
      loadData() // 重新加载列表
    } else {
      ElMessage.error(response.message || '导入失败')
    }
  } catch (error) {
    console.error('智能导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importLoading.value = false
  }
}

const handleExport = async () => {
  try {
    const response = await exportQuestions({
      keyword: searchForm.keyword,
      type: searchForm.type,
      difficulty: searchForm.difficulty,
      favorite: searchForm.favorite
    })

    if (response.success) {
      // 创建下载链接
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `questions_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      window.URL.revokeObjectURL(url)

      ElMessage.success('导出成功')
    } else {
      ElMessage.error(response.message || '导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const showColumnSettings = () => {
  ElMessage.info('列设置功能开发中...')
}

// 工具方法
const parseOptions = (options) => {
  if (!options) return []
  return options.split('\n').filter(opt => opt.trim())
}

const getTypeName = (type) => {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    judgement: '判断题',
    completion: '填空题'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
  const typeMap = {
    single: 'primary',
    multiple: 'success',
    judgement: 'warning',
    completion: 'info'
  }
  return typeMap[type] || 'info'
}

const getDifficultyName = (difficulty) => {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return difficultyMap[difficulty] || difficulty
}

const getDifficultyTagType = (difficulty) => {
  const difficultyMap = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return difficultyMap[difficulty] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.questions-list {
  padding: 20px;
}

.search-card,
.toolbar-card,
.table-card {
  margin-bottom: 20px;
}

.search-form {
  .el-form-item {
    margin-bottom: 0;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .toolbar-left {
    display: flex;
    gap: 12px;
  }
  
  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.question-content {
  .question-text {
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .question-options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .el-tag {
      font-size: 11px;
    }
  }
}

.answer-text {
  max-width: 180px;
}

.favorite-icon {
  cursor: pointer;
  color: #c0c4cc;
  transition: color 0.3s;
  
  &:hover {
    color: #f56c6c;
  }
  
  &.favorite-active {
    color: #f56c6c;
  }
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.question-detail {
  .detail-section {
    margin-bottom: 24px;
    
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      font-weight: 500;
    }
    
    .detail-content {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      line-height: 1.6;
      white-space: pre-wrap;
      
      &.answer-content {
        background: #f0f9ff;
        border: 1px solid #b3d8ff;
        color: #409eff;
        font-weight: 500;
      }
    }
    
    .option-item {
      padding: 4px 0;
      border-bottom: 1px solid #ebeef5;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .questions-list {
    padding: 10px;
  }
  
  .search-form {
    .el-form-item {
      display: block;
      margin-bottom: 12px;
    }
  }
  
  .toolbar {
    flex-direction: column;
    gap: 12px;
    
    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: center;
    }
  }
}

.import-tips {
  margin-bottom: 20px;
}

.import-tips ul {
  margin: 10px 0 0 20px;
  padding: 0;
}

.import-tips li {
  margin: 5px 0;
  color: #606266;
}

.dialog-footer {
  text-align: right;
}
</style>
