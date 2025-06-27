<template>
  <div class="questions-import">
    <!-- 导入步骤 -->
    <el-card class="steps-card" shadow="hover">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="选择文件" description="上传题目文件" />
        <el-step title="数据预览" description="预览导入数据" />
        <el-step title="字段映射" description="配置字段映射" />
        <el-step title="导入完成" description="查看导入结果" />
      </el-steps>
    </el-card>

    <!-- 步骤1: 文件上传 -->
    <el-card v-if="currentStep === 0" class="upload-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Upload /></el-icon>
          <span>上传题目文件</span>
        </div>
      </template>

      <div class="upload-section">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeUpload"
          accept=".xlsx,.xls,.csv,.json"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 Excel (.xlsx, .xls)、CSV (.csv)、JSON (.json) 格式文件，文件大小不超过 10MB
            </div>
          </template>
        </el-upload>

        <div class="upload-actions">
          <el-button type="primary" @click="nextStep" :disabled="!uploadFile">
            下一步
          </el-button>
          <el-button @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>
      </div>

      <!-- 文件格式说明 -->
      <div class="format-info">
        <h4>文件格式说明</h4>
        <el-table :data="formatExample" border size="small">
          <el-table-column prop="field" label="字段名" width="120" />
          <el-table-column prop="description" label="说明" />
          <el-table-column prop="example" label="示例" />
          <el-table-column prop="required" label="必填" width="80">
            <template #default="{ row }">
              <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                {{ row.required ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 步骤2: 数据预览 -->
    <el-card v-if="currentStep === 1" class="preview-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><View /></el-icon>
          <span>数据预览</span>
          <div class="header-actions">
            <span class="file-info">{{ uploadFile?.name }} ({{ previewData.length }} 条记录)</span>
          </div>
        </div>
      </template>

      <div class="preview-section">
        <el-table :data="previewData.slice(0, 10)" border max-height="400">
          <el-table-column
            v-for="(column, index) in previewColumns"
            :key="index"
            :prop="column"
            :label="column"
            show-overflow-tooltip
          />
        </el-table>
        
        <div v-if="previewData.length > 10" class="preview-tip">
          <el-alert
            title="仅显示前10条数据预览"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <div class="preview-actions">
        <el-button @click="prevStep">上一步</el-button>
        <el-button type="primary" @click="nextStep" :disabled="!previewData.length">
          下一步
        </el-button>
      </div>
    </el-card>

    <!-- 步骤3: 字段映射 -->
    <el-card v-if="currentStep === 2" class="mapping-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Connection /></el-icon>
          <span>字段映射配置</span>
        </div>
      </template>

      <div class="mapping-section">
        <el-form :model="fieldMapping" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <h4>系统字段</h4>
              <el-form-item label="题目内容" required>
                <el-select v-model="fieldMapping.question" placeholder="选择对应列">
                  <el-option
                    v-for="column in previewColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="答案" required>
                <el-select v-model="fieldMapping.answer" placeholder="选择对应列">
                  <el-option
                    v-for="column in previewColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="题型">
                <el-select v-model="fieldMapping.type" placeholder="选择对应列">
                  <el-option
                    v-for="column in previewColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="选项">
                <el-select v-model="fieldMapping.options" placeholder="选择对应列">
                  <el-option
                    v-for="column in previewColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="难度">
                <el-select v-model="fieldMapping.difficulty" placeholder="选择对应列">
                  <el-option
                    v-for="column in previewColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <h4>映射预览</h4>
              <div class="mapping-preview">
                <div v-for="(item, index) in previewData.slice(0, 3)" :key="index" class="preview-item">
                  <div class="preview-title">示例 {{ index + 1 }}</div>
                  <el-descriptions :column="1" size="small" border>
                    <el-descriptions-item label="题目">
                      {{ item[fieldMapping.question] || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="答案">
                      {{ item[fieldMapping.answer] || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="题型">
                      {{ item[fieldMapping.type] || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="选项">
                      {{ item[fieldMapping.options] || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="难度">
                      {{ item[fieldMapping.difficulty] || '-' }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="mapping-actions">
        <el-button @click="prevStep">上一步</el-button>
        <el-button type="primary" @click="startImport" :loading="importing">
          {{ importing ? '导入中...' : '开始导入' }}
        </el-button>
      </div>
    </el-card>

    <!-- 步骤4: 导入结果 -->
    <el-card v-if="currentStep === 3" class="result-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><SuccessFilled /></el-icon>
          <span>导入完成</span>
        </div>
      </template>

      <div class="result-section">
        <el-result
          :icon="importResult.success ? 'success' : 'error'"
          :title="importResult.success ? '导入成功' : '导入失败'"
          :sub-title="importResult.message"
        >
          <template #extra>
            <div class="result-stats">
              <el-statistic title="总记录数" :value="importResult.total" />
              <el-statistic title="成功导入" :value="importResult.success_count" />
              <el-statistic title="失败记录" :value="importResult.error_count" />
            </div>
            
            <div class="result-actions">
              <el-button type="primary" @click="goToQuestionList">查看题库</el-button>
              <el-button @click="resetImport">重新导入</el-button>
              <el-button v-if="importResult.error_count > 0" @click="downloadErrorLog">
                下载错误日志
              </el-button>
            </div>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Upload,
  UploadFilled,
  Download,
  View,
  Connection,
  SuccessFilled
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const currentStep = ref(0)
const uploadRef = ref()
const uploadFile = ref(null)
const previewData = ref([])
const previewColumns = ref([])
const importing = ref(false)

const fieldMapping = reactive({
  question: '',
  answer: '',
  type: '',
  options: '',
  difficulty: ''
})

const importResult = reactive({
  success: false,
  message: '',
  total: 0,
  success_count: 0,
  error_count: 0
})

const formatExample = [
  {
    field: 'question',
    description: '题目内容',
    example: '以下哪个是Vue.js的特性？',
    required: true
  },
  {
    field: 'answer',
    description: '题目答案',
    example: 'D',
    required: true
  },
  {
    field: 'type',
    description: '题目类型',
    example: 'single/multiple/judgement/completion',
    required: false
  },
  {
    field: 'options',
    description: '选择题选项',
    example: 'A.响应式\nB.组件化\nC.虚拟DOM\nD.以上都是',
    required: false
  },
  {
    field: 'difficulty',
    description: '难度等级',
    example: 'easy/medium/hard',
    required: false
  }
]

// 方法
const handleFileChange = (file) => {
  uploadFile.value = file.raw
  parseFile(file.raw)
}

const beforeUpload = (file) => {
  const isValidType = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                      'application/vnd.ms-excel', 
                      'text/csv', 
                      'application/json'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只能上传 Excel、CSV 或 JSON 格式的文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  return false // 阻止自动上传
}

const parseFile = async (file) => {
  try {
    // 模拟文件解析
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟解析结果
    previewColumns.value = ['题目', '答案', '类型', '选项', '难度']
    previewData.value = Array.from({ length: 50 }, (_, index) => ({
      '题目': `这是第${index + 1}道题目的内容`,
      '答案': `答案${index + 1}`,
      '类型': ['单选题', '多选题', '判断题', '填空题'][index % 4],
      '选项': index % 4 < 2 ? 'A.选项A\nB.选项B\nC.选项C\nD.选项D' : '',
      '难度': ['简单', '中等', '困难'][index % 3]
    }))
    
    ElMessage.success('文件解析成功')
  } catch (error) {
    ElMessage.error('文件解析失败')
  }
}

const downloadTemplate = () => {
  // 模拟下载模板
  ElMessage.success('模板下载中...')
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
    
    // 自动映射字段
    if (currentStep.value === 2) {
      autoMapFields()
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const autoMapFields = () => {
  // 自动映射常见字段名
  const mapping = {
    question: ['题目', '问题', 'question', 'title'],
    answer: ['答案', 'answer', '正确答案'],
    type: ['类型', '题型', 'type', 'question_type'],
    options: ['选项', 'options', '选择项'],
    difficulty: ['难度', 'difficulty', '难度等级']
  }
  
  Object.keys(mapping).forEach(field => {
    const matchedColumn = previewColumns.value.find(column => 
      mapping[field].some(keyword => 
        column.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    if (matchedColumn) {
      fieldMapping[field] = matchedColumn
    }
  })
}

const startImport = async () => {
  if (!fieldMapping.question || !fieldMapping.answer) {
    ElMessage.error('题目内容和答案为必填字段')
    return
  }
  
  importing.value = true
  
  try {
    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 模拟导入结果
    const total = previewData.value.length
    const successCount = Math.floor(total * 0.9)
    const errorCount = total - successCount
    
    Object.assign(importResult, {
      success: true,
      message: `成功导入 ${successCount} 条记录`,
      total,
      success_count: successCount,
      error_count: errorCount
    })
    
    currentStep.value = 3
    ElMessage.success('导入完成')
  } catch (error) {
    Object.assign(importResult, {
      success: false,
      message: '导入过程中发生错误',
      total: previewData.value.length,
      success_count: 0,
      error_count: previewData.value.length
    })
    currentStep.value = 3
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const resetImport = () => {
  currentStep.value = 0
  uploadFile.value = null
  previewData.value = []
  previewColumns.value = []
  Object.assign(fieldMapping, {
    question: '',
    answer: '',
    type: '',
    options: '',
    difficulty: ''
  })
  uploadRef.value?.clearFiles()
}

const goToQuestionList = () => {
  router.push('/questions/list')
}

const downloadErrorLog = () => {
  ElMessage.success('错误日志下载中...')
}
</script>

<style lang="scss" scoped>
.questions-import {
  padding: 20px;
}

.steps-card,
.upload-card,
.preview-card,
.mapping-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .header-actions {
    margin-left: auto;
    
    .file-info {
      font-size: 14px;
      color: #909399;
    }
  }
}

.upload-section {
  .upload-dragger {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .upload-actions {
    text-align: center;
    margin-bottom: 30px;
  }
}

.format-info {
  h4 {
    margin: 0 0 16px 0;
    color: #303133;
  }
}

.preview-section {
  .preview-tip {
    margin-top: 16px;
  }
}

.preview-actions,
.mapping-actions {
  margin-top: 20px;
  text-align: center;
}

.mapping-section {
  h4 {
    margin: 0 0 16px 0;
    color: #303133;
  }
  
  .mapping-preview {
    .preview-item {
      margin-bottom: 20px;
      
      .preview-title {
        font-weight: 500;
        margin-bottom: 8px;
        color: #606266;
      }
    }
  }
}

.result-section {
  .result-stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 30px;
  }
  
  .result-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .questions-import {
    padding: 10px;
  }
  
  .result-stats {
    flex-direction: column;
    gap: 20px !important;
  }
  
  .result-actions {
    flex-direction: column;
    align-items: center;
    
    .el-button {
      width: 200px;
    }
  }
}
</style>
