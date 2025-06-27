<template>
  <div class="batch-search">
    <!-- 批量搜索表单 -->
    <el-card class="search-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Files /></el-icon>
          <span>批量搜题</span>
        </div>
      </template>

      <el-tabs v-model="inputMethod" @tab-change="handleTabChange">
        <!-- 文本输入 -->
        <el-tab-pane label="文本输入" name="text">
          <div class="text-input-section">
            <el-form :model="batchForm" label-width="100px">
              <el-form-item label="题目列表">
                <el-input
                  v-model="batchForm.questions"
                  type="textarea"
                  :rows="10"
                  placeholder="请输入题目，每行一个题目..."
                  show-word-limit
                  maxlength="10000"
                />
                <div class="input-tip">
                  <el-icon><InfoFilled /></el-icon>
                  <span>每行输入一个题目，最多支持100个题目</span>
                </div>
              </el-form-item>
              
              <el-form-item label="搜索配置">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-select v-model="batchForm.strategy" placeholder="并发策略">
                      <el-option label="最快响应" value="first_success" />
                      <el-option label="最佳响应" value="best_response" />
                      <el-option label="多数投票" value="majority_vote" />
                    </el-select>
                  </el-col>
                  <el-col :span="8">
                    <el-input-number
                      v-model="batchForm.concurrent_limit"
                      :min="1"
                      :max="10"
                      controls-position="right"
                      placeholder="并发数量"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-input-number
                      v-model="batchForm.timeout"
                      :min="5"
                      :max="60"
                      controls-position="right"
                      placeholder="超时时间(秒)"
                    />
                  </el-col>
                </el-row>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 文件上传 -->
        <el-tab-pane label="文件上传" name="file">
          <div class="file-upload-section">
            <el-upload
              ref="uploadRef"
              class="upload-dragger"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :before-upload="beforeUpload"
              accept=".txt,.xlsx,.xls,.csv"
              :limit="1"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 TXT、Excel、CSV 格式文件，文件大小不超过 5MB
                </div>
              </template>
            </el-upload>

            <div v-if="uploadedFile" class="file-info">
              <el-alert
                :title="`已选择文件: ${uploadedFile.name}`"
                type="success"
                :closable="false"
                show-icon
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="search-actions">
        <el-button 
          type="primary" 
          size="large"
          :loading="searching" 
          @click="startBatchSearch"
          :disabled="!canStartSearch"
        >
          <el-icon><Search /></el-icon>
          {{ searching ? '搜索中...' : '开始批量搜题' }}
        </el-button>
        <el-button size="large" @click="resetForm">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
        <el-button size="large" @click="loadExample">
          <el-icon><DocumentCopy /></el-icon>
          加载示例
        </el-button>
      </div>
    </el-card>

    <!-- 搜索进度 -->
    <el-card v-if="searching || searchResults.length > 0" class="progress-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><TrendCharts /></el-icon>
          <span>搜索进度</span>
          <div class="header-actions">
            <el-tag v-if="searching" type="primary">搜索中</el-tag>
            <el-tag v-else-if="searchCompleted" type="success">已完成</el-tag>
          </div>
        </div>
      </template>

      <div class="progress-section">
        <el-progress
          :percentage="searchProgress"
          :status="searching ? 'active' : 'success'"
          :stroke-width="8"
        />
        <div class="progress-info">
          <span>已完成: {{ completedCount }} / {{ totalCount }}</span>
          <span>成功率: {{ successRate }}%</span>
          <span v-if="searching">预计剩余: {{ estimatedTime }}</span>
        </div>
      </div>
    </el-card>

    <!-- 搜索结果 -->
    <el-card v-if="searchResults.length > 0" class="results-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><DocumentChecked /></el-icon>
          <span>搜索结果</span>
          <div class="header-actions">
            <el-button type="success" @click="exportResults" :icon="Download">导出结果</el-button>
            <el-button type="primary" @click="saveAllToLibrary" :icon="Collection">保存到题库</el-button>
          </div>
        </div>
      </template>

      <!-- 结果筛选 -->
      <div class="results-filter">
        <el-radio-group v-model="resultFilter" @change="filterResults">
          <el-radio-button value="all">全部 ({{ searchResults.length }})</el-radio-button>
          <el-radio-button value="success">成功 ({{ successResults.length }})</el-radio-button>
          <el-radio-button value="failed">失败 ({{ failedResults.length }})</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 结果列表 -->
      <div class="results-list">
        <div 
          v-for="(result, index) in filteredResults" 
          :key="index"
          class="result-item"
          :class="{ 'result-success': result.success, 'result-failed': !result.success }"
        >
          <div class="result-header">
            <div class="result-index">#{{ index + 1 }}</div>
            <div class="result-status">
              <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                {{ result.success ? '成功' : '失败' }}
              </el-tag>
              <span class="result-time">{{ result.duration }}ms</span>
            </div>
          </div>
          
          <div class="result-content">
            <div class="result-question">
              <h4>题目:</h4>
              <div class="question-text">{{ result.question }}</div>
            </div>
            
            <div v-if="result.success" class="result-answer">
              <h4>答案:</h4>
              <div class="answer-text">{{ result.answer }}</div>
              <div class="result-actions">
                <el-button type="primary" size="small" @click="copyAnswer(result.answer)">
                  <el-icon><CopyDocument /></el-icon>
                  复制答案
                </el-button>
                <el-button type="success" size="small" @click="saveToLibrary(result)">
                  <el-icon><Plus /></el-icon>
                  保存到题库
                </el-button>
              </div>
            </div>
            
            <div v-else class="result-error">
              <h4>错误信息:</h4>
              <div class="error-text">{{ result.error }}</div>
              <div class="result-actions">
                <el-button type="warning" size="small" @click="retrySearch(result, index)">
                  <el-icon><RefreshRight /></el-icon>
                  重新搜索
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="filteredResults.length > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredResults.length"
          layout="prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Files,
  InfoFilled,
  UploadFilled,
  Search,
  RefreshRight,
  DocumentCopy,
  TrendCharts,
  DocumentChecked,
  Download,
  Collection,
  CopyDocument,
  Plus
} from '@element-plus/icons-vue'

// 响应式数据
const inputMethod = ref('text')
const searching = ref(false)
const searchCompleted = ref(false)
const uploadRef = ref()
const uploadedFile = ref(null)
const resultFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

const batchForm = reactive({
  questions: '',
  strategy: 'first_success',
  concurrent_limit: 3,
  timeout: 30
})

const searchResults = ref([])
const completedCount = ref(0)
const totalCount = ref(0)

// 计算属性
const canStartSearch = computed(() => {
  if (inputMethod.value === 'text') {
    return batchForm.questions.trim().length > 0
  } else {
    return uploadedFile.value !== null
  }
})

const searchProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const successResults = computed(() => {
  return searchResults.value.filter(result => result.success)
})

const failedResults = computed(() => {
  return searchResults.value.filter(result => !result.success)
})

const successRate = computed(() => {
  if (searchResults.value.length === 0) return 0
  return Math.round((successResults.value.length / searchResults.value.length) * 100)
})

const estimatedTime = computed(() => {
  if (completedCount.value === 0) return '计算中...'
  const avgTime = searchResults.value.reduce((sum, result) => sum + result.duration, 0) / completedCount.value
  const remainingCount = totalCount.value - completedCount.value
  const remainingSeconds = Math.round((remainingCount * avgTime) / 1000)
  return `${remainingSeconds}秒`
})

const filteredResults = computed(() => {
  let results = searchResults.value
  if (resultFilter.value === 'success') {
    results = successResults.value
  } else if (resultFilter.value === 'failed') {
    results = failedResults.value
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return results.slice(start, end)
})

// 方法
const handleTabChange = () => {
  resetForm()
}

const handleFileChange = (file) => {
  uploadedFile.value = file.raw
  parseFile(file.raw)
}

const beforeUpload = (file) => {
  const isValidType = ['text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                      'application/vnd.ms-excel', 'text/csv'].includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isValidType) {
    ElMessage.error('只能上传 TXT、Excel 或 CSV 格式的文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('文件大小不能超过 5MB!')
    return false
  }
  return false // 阻止自动上传
}

const parseFile = async (file) => {
  try {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    batchForm.questions = lines.join('\n')
    ElMessage.success(`成功解析 ${lines.length} 个题目`)
  } catch (error) {
    ElMessage.error('文件解析失败')
  }
}

const startBatchSearch = async () => {
  const questions = getQuestionsList()
  if (questions.length === 0) {
    ElMessage.error('请输入题目')
    return
  }

  if (questions.length > 100) {
    ElMessage.error('最多支持100个题目')
    return
  }

  searching.value = true
  searchCompleted.value = false
  searchResults.value = []
  completedCount.value = 0
  totalCount.value = questions.length

  // 模拟批量搜索
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    const startTime = Date.now()
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
      
      const duration = Date.now() - startTime
      const success = Math.random() > 0.2 // 80% 成功率
      
      if (success) {
        searchResults.value.push({
          question,
          answer: `这是题目"${question}"的答案`,
          success: true,
          duration
        })
      } else {
        searchResults.value.push({
          question,
          error: '搜索失败，请重试',
          success: false,
          duration
        })
      }
    } catch (error) {
      searchResults.value.push({
        question,
        error: error.message,
        success: false,
        duration: Date.now() - startTime
      })
    }
    
    completedCount.value++
  }

  searching.value = false
  searchCompleted.value = true
  ElMessage.success('批量搜索完成')
}

const getQuestionsList = () => {
  if (inputMethod.value === 'text') {
    return batchForm.questions.split('\n').filter(q => q.trim()).map(q => q.trim())
  } else if (uploadedFile.value) {
    // 从文件中解析题目
    return batchForm.questions.split('\n').filter(q => q.trim()).map(q => q.trim())
  }
  return []
}

const resetForm = () => {
  batchForm.questions = ''
  uploadedFile.value = null
  searchResults.value = []
  completedCount.value = 0
  totalCount.value = 0
  searching.value = false
  searchCompleted.value = false
  uploadRef.value?.clearFiles()
}

const loadExample = () => {
  batchForm.questions = `以下哪个是Vue.js的核心特性？
JavaScript中的闭包是什么？
CSS中的flex布局如何使用？
什么是HTTP协议？
数据库中的索引有什么作用？`
  ElMessage.success('示例题目已加载')
}

const filterResults = () => {
  currentPage.value = 1
}

const handlePageChange = () => {
  // 分页变化处理
}

const copyAnswer = async (answer) => {
  try {
    await navigator.clipboard.writeText(answer)
    ElMessage.success('答案已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const saveToLibrary = (result) => {
  ElMessage.success('已保存到题库')
}

const saveAllToLibrary = async () => {
  try {
    await ElMessageBox.confirm(`确定要将 ${successResults.value.length} 个成功结果保存到题库吗？`, '提示', {
      type: 'info'
    })
    
    ElMessage.success('批量保存成功')
  } catch {
    // 用户取消
  }
}

const exportResults = () => {
  ElMessage.success('结果导出中...')
}

const retrySearch = async (result, index) => {
  const startTime = Date.now()
  
  try {
    // 模拟重新搜索
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const duration = Date.now() - startTime
    const success = Math.random() > 0.3 // 70% 成功率
    
    if (success) {
      searchResults.value[index] = {
        question: result.question,
        answer: `这是题目"${result.question}"的答案`,
        success: true,
        duration
      }
      ElMessage.success('重新搜索成功')
    } else {
      ElMessage.error('重新搜索仍然失败')
    }
  } catch (error) {
    ElMessage.error('重新搜索失败')
  }
}

// 监听器
watch(resultFilter, () => {
  currentPage.value = 1
})
</script>

<style lang="scss" scoped>
.batch-search {
  padding: 20px;
}

.search-card,
.progress-card,
.results-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
}

.text-input-section {
  .input-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}

.file-upload-section {
  .upload-dragger {
    width: 100%;
  }
  
  .file-info {
    margin-top: 16px;
  }
}

.search-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.progress-section {
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-size: 14px;
    color: #606266;
  }
}

.results-filter {
  margin-bottom: 20px;
}

.results-list {
  .result-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
    
    &.result-success {
      border-left: 4px solid #67c23a;
    }
    
    &.result-failed {
      border-left: 4px solid #f56c6c;
    }
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;
      
      .result-index {
        font-weight: 500;
        color: #303133;
      }
      
      .result-status {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .result-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
    
    .result-content {
      padding: 16px;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #606266;
      }
      
      .question-text {
        margin-bottom: 16px;
        line-height: 1.6;
      }
      
      .answer-text {
        padding: 12px;
        background: #f0f9ff;
        border: 1px solid #b3d8ff;
        border-radius: 4px;
        color: #409eff;
        margin-bottom: 12px;
        line-height: 1.6;
      }
      
      .error-text {
        padding: 12px;
        background: #fef0f0;
        border: 1px solid #fbc4c4;
        border-radius: 4px;
        color: #f56c6c;
        margin-bottom: 12px;
      }
      
      .result-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

// 响应式设计
@media (max-width: 768px) {
  .batch-search {
    padding: 10px;
  }
  
  .search-actions {
    flex-direction: column;
    align-items: center;
    
    .el-button {
      width: 200px;
    }
  }
  
  .progress-info {
    flex-direction: column !important;
    gap: 8px;
  }
  
  .result-header {
    flex-direction: column !important;
    gap: 8px;
    text-align: center;
  }
  
  .result-actions {
    flex-direction: column !important;
    
    .el-button {
      width: 100%;
    }
  }
}
</style>
