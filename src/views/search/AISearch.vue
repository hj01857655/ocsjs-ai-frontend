<template>
  <div class="ai-search-container">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><MagicStick /></el-icon>
          <span>AI智能搜题</span>
        </div>
      </template>

      <el-form ref="searchFormRef" :model="searchForm" :rules="searchRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="题目内容" prop="question">
              <div class="question-input-wrapper">
                <el-input
                  v-model="searchForm.question"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入题目内容，系统会自动识别题型并提取选项..."
                  show-word-limit
                  maxlength="1000"
                  clearable
                  @input="handleQuestionInput"
                  @blur="parseQuestionContent"
                  @focus="handleQuestionFocus"
                />

                <!-- 智能预测建议 -->
                <div v-if="predictions.length > 0" class="predictions-dropdown">
                  <div class="predictions-header">
                    <el-icon><Search /></el-icon>
                    <span>智能预测</span>
                  </div>
                  <div
                    v-for="(prediction, index) in predictions"
                    :key="index"
                    class="prediction-item"
                    @click="selectPrediction(prediction)"
                  >
                    <div class="prediction-text">{{ prediction.text }}</div>
                    <div class="prediction-meta">
                      <el-tag size="small" :type="getTypeColor(prediction.type)">
                        {{ getTypeName(prediction.type) }}
                      </el-tag>
                      <span class="prediction-confidence">{{ prediction.confidence }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 题目质量检测 -->
              <div v-if="qualityCheck.checked" class="quality-check">
                <div class="quality-score">
                  <span class="label">题目质量评分:</span>
                  <el-rate
                    v-model="qualityCheck.score"
                    :max="5"
                    disabled
                    show-score
                    text-color="#ff9900"
                  />
                  <span class="score-text">{{ getQualityText(qualityCheck.score) }}</span>
                </div>

                <!-- AI智能建议 -->
                <div v-if="aiSuggestions.length > 0" class="ai-suggestions">
                  <div class="suggestions-header">
                    <el-icon><InfoFilled /></el-icon>
                    <span>AI智能建议</span>
                  </div>
                  <div class="suggestions-list">
                    <div
                      v-for="(suggestion, index) in aiSuggestions"
                      :key="index"
                      class="suggestion-item"
                      :class="suggestion.type"
                    >
                      <div class="suggestion-content">
                        <div class="suggestion-title">{{ suggestion.title }}</div>
                        <div class="suggestion-desc">{{ suggestion.description }}</div>
                        <div v-if="suggestion.example" class="suggestion-example">
                          <span class="example-label">示例：</span>
                          <code>{{ suggestion.example }}</code>
                        </div>
                      </div>
                      <el-button
                        v-if="suggestion.action"
                        type="text"
                        size="small"
                        @click="applySuggestion(suggestion)"
                      >
                        应用建议
                      </el-button>
                    </div>
                  </div>
                </div>

                <div v-if="qualityCheck.issues.length > 0" class="quality-issues">
                  <el-alert
                    title="题目质量问题"
                    type="warning"
                    :closable="false"
                    show-icon
                  >
                    <ul>
                      <li v-for="issue in qualityCheck.issues" :key="issue">{{ issue }}</li>
                    </ul>
                  </el-alert>
                </div>
              </div>
              <div v-if="parseResult.detected" class="parse-hint">
                <el-tag type="success" size="small">
                  <el-icon><Check /></el-icon>
                  已识别为{{ parseResult.typeName }}，自动提取了{{ parseResult.optionCount }}个选项
                </el-tag>
                <el-button
                  type="text"
                  size="small"
                  @click="showParseDetails = !showParseDetails"
                  style="margin-left: 8px;"
                >
                  {{ showParseDetails ? '隐藏' : '查看' }}解析详情
                </el-button>
              </div>

              <!-- 解析详情 -->
              <div v-if="parseResult.detected && showParseDetails" class="parse-details">
                <el-card shadow="never" class="parse-details-card">
                  <div class="parse-info">
                    <div class="parse-item">
                      <span class="label">识别依据:</span>
                      <el-tag size="small" type="info">{{ parseResult.reason }}</el-tag>
                    </div>
                    <div class="parse-item" v-if="parseResult.confidence">
                      <span class="label">识别置信度:</span>
                      <el-progress
                        :percentage="parseResult.confidence"
                        :stroke-width="6"
                        :show-text="true"
                        :color="getConfidenceColor(parseResult.confidence)"
                      />
                    </div>
                    <div class="parse-item" v-if="parseResult.suggestions.length > 0">
                      <span class="label">优化建议:</span>
                      <ul class="suggestions-list">
                        <li v-for="suggestion in parseResult.suggestions" :key="suggestion">
                          {{ suggestion }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="题目类型" prop="type">
              <el-select v-model="searchForm.type" placeholder="请选择题目类型" clearable @change="handleTypeChange">
                <el-option-group label="选择题">
                  <el-option label="单选题" value="single" />
                  <el-option label="多选题" value="multiple" />
                  <el-option label="判断题" value="judgement" />
                </el-option-group>
                <el-option-group label="主观题">
                  <el-option label="填空题" value="completion" />
                  <el-option label="简答题" value="short_answer" />
                  <el-option label="论述题" value="essay" />
                  <el-option label="计算题" value="calculation" />
                  <el-option label="分析题" value="analysis" />
                </el-option-group>
                <el-option-group label="应用题">
                  <el-option label="编程题" value="programming" />
                  <el-option label="设计题" value="design" />
                  <el-option label="案例分析" value="case_study" />
                  <el-option label="实验题" value="experiment" />
                </el-option-group>
                <el-option-group label="其他">
                  <el-option label="排序题" value="ordering" />
                  <el-option label="匹配题" value="matching" />
                  <el-option label="连线题" value="connection" />
                  <el-option label="综合题" value="comprehensive" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="并发模式">
              <div class="concurrent-control">
                <el-switch
                  v-model="searchForm.concurrent"
                  active-text="启用"
                  inactive-text="关闭"
                  active-color="#13ce66"
                  inactive-color="#ff4949"
                />
                <el-tooltip placement="top">
                  <template #content>
                    <div>
                      <div><strong>关闭（推荐）</strong>：快速响应，适合大多数题目</div>
                      <div><strong>启用</strong>：多模型并发，提高复杂题目准确率</div>
                      <div style="margin-top: 8px; color: #67c23a;">💡 系统会根据题目复杂度智能推荐</div>
                    </div>
                  </template>
                  <el-icon style="margin-left: 8px; color: #909399; cursor: help;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>

                <el-tooltip v-if="smartRecommendation.strategy" placement="top">
                  <template #content>
                    <div>AI推荐：{{ smartRecommendation.reason }}</div>
                  </template>
                  <el-tag
                    size="small"
                    type="success"
                    style="margin-left: 8px; cursor: pointer;"
                    @click="applyRecommendedStrategy"
                  >
                    <el-icon><MagicStick /></el-icon>
                    智能推荐
                  </el-tag>
                </el-tooltip>
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="24" v-if="searchForm.type === 'single' || searchForm.type === 'multiple'">
            <el-form-item label="选项内容">
              <el-input
                v-model="searchForm.options"
                type="textarea"
                :rows="3"
                placeholder="请输入选项内容，每行一个选项..."
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :span="24" v-if="searchForm.concurrent">
            <el-form-item label="并发策略">
              <el-radio-group v-model="searchForm.strategy">
                <el-radio value="first_success">
                  <span>最快响应</span>
                  <el-tooltip content="使用单个AI模型快速响应，速度最快" placement="top">
                    <el-icon style="margin-left: 4px; color: #909399;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </el-radio>
                <el-radio value="best_response">
                  <span>最佳响应</span>
                  <el-tooltip content="多个AI模型并发，选择最佳答案，准确度更高" placement="top">
                    <el-icon style="margin-left: 4px; color: #909399;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </el-radio>
                <el-radio value="majority_vote">
                  <span>多数投票</span>
                  <el-tooltip content="多个AI模型投票决定，最可靠但速度较慢" placement="top">
                    <el-icon style="margin-left: 4px; color: #909399;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button
            type="primary"
            :loading="searching"
            @click="handleSearch"
            size="large"
            :icon="Search"
          >
            {{ searching ? '搜索中...' : '开始搜题' }}
          </el-button>
          <el-button @click="handleReset" :icon="RefreshRight">重置</el-button>
          <el-button @click="handleExample" :icon="DocumentCopy">示例题目</el-button>
          <el-dropdown @command="handleHistoryCommand" v-if="searchHistory.length > 0">
            <el-button :icon="Clock">
              搜索历史<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(item, index) in searchHistory.slice(0, 5)"
                  :key="index"
                  :command="{ type: 'select', data: item }"
                >
                  {{ item.question.substring(0, 30) }}{{ item.question.length > 30 ? '...' : '' }}
                </el-dropdown-item>
                <el-dropdown-item divided :command="{ type: 'clear' }">
                  <span style="color: #f56c6c;">清空历史</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 搜索进度 -->
    <el-card v-if="searching" class="progress-card" shadow="hover">
      <div class="search-progress">
        <div class="progress-content">
          <el-icon class="rotating"><Loading /></el-icon>
          <span class="progress-text">{{ searchProgress.text }}</span>
        </div>
        <el-progress
          :percentage="searchProgress.percentage"
          :status="searchProgress.status"
          :stroke-width="6"
        />
        <div class="progress-tips">
          <el-tag size="small" type="info">{{ searchProgress.tip }}</el-tag>
        </div>
      </div>
    </el-card>

    <!-- 搜索结果 -->
    <el-card v-if="searchResult" class="result-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><DocumentChecked /></el-icon>
          <span>搜索结果</span>
          <div class="header-actions">
            <el-tag :type="searchResult.success ? 'success' : 'danger'">
              {{ searchResult.success ? '成功' : '失败' }}
            </el-tag>
            <el-tag type="info">{{ searchTime }}ms</el-tag>
          </div>
        </div>
      </template>

      <div v-if="searchResult.success" class="result-content">
        <div class="question-section">
          <h4>题目：</h4>
          <div class="question-text">{{ searchResult.question }}</div>
        </div>

        <!-- 显示选项 - 只在选择题时显示 -->
        <div v-if="searchForm.options && ['single', 'multiple'].includes(searchForm.type)" class="options-section">
          <h4>选项</h4>
          <div class="options-list">
            <div
              v-for="(option, index) in formatOptions(searchForm.options)"
              :key="index"
              class="option-item"
            >
              {{ option }}
            </div>
          </div>
        </div>

        <div class="answer-section">
          <div class="answer-header">
            <h4>答案：</h4>
            <div class="answer-meta">
              <el-tag v-if="searchResult.confidence" :type="getConfidenceType(searchResult.confidence)" size="small">
                置信度: {{ (searchResult.confidence * 100).toFixed(0) }}%
              </el-tag>
              <el-tag v-if="searchResult.source" type="info" size="small">
                {{ getSourceName(searchResult.source) }}
              </el-tag>
            </div>
          </div>
          <div class="answer-text" :class="{ 'highlight': true }">
            {{ formatAnswer(searchResult.answer, searchForm.options, searchForm.type) }}
          </div>
        </div>

        <div class="actions">
          <el-button type="success" :icon="Check" @click="handleSave">保存到题库</el-button>
          <el-button type="primary" :icon="CopyDocument" @click="handleCopy">复制答案</el-button>
          <el-button type="warning" :icon="RefreshRight" @click="handleRetry">重新搜索</el-button>
          <el-button type="info" :icon="Share" @click="handleShare">分享题目</el-button>
          <el-button type="default" :icon="Star" @click="handleFavorite">
            {{ isFavorited ? '取消收藏' : '收藏题目' }}
          </el-button>
        </div>

        <!-- 相关题目推荐 -->
        <div v-if="relatedQuestions.length > 0" class="related-questions">
          <h4>相关题目推荐</h4>
          <div class="related-list">
            <div
              v-for="(question, index) in relatedQuestions"
              :key="index"
              class="related-item"
              @click="selectRelatedQuestion(question)"
            >
              <div class="related-content">
                <div class="related-question">{{ question.question }}</div>
                <div class="related-meta">
                  <el-tag size="small" :type="getTypeColor(question.type)">
                    {{ getTypeName(question.type) }}
                  </el-tag>
                  <span class="similarity">相似度: {{ question.similarity }}%</span>
                </div>
              </div>
              <el-icon class="related-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="error-content">
        <el-alert
          :title="searchResult.message || '搜索失败'"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
    </el-card>


  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  RefreshRight,
  DocumentCopy,
  DocumentChecked,
  Check,
  CopyDocument,
  MagicStick,
  QuestionFilled,
  Clock,
  ArrowDown,
  Loading,
  Share,
  Star,
  ArrowRight,
  InfoFilled,
  Tools
} from '@element-plus/icons-vue'
import { searchQuestion } from '@/api/search'
import { saveQuestion } from '@/api/questions'
import { checkQuestionQuality, getQualitySuggestions, getQualityText } from '@/utils/validate'

// 响应式数据
const searchFormRef = ref()
const searching = ref(false)
const searchResult = ref(null)
const searchTime = ref(0)

// 题目解析结果
const parseResult = reactive({
  detected: false,
  typeName: '',
  optionCount: 0,
  reason: '',
  confidence: 0,
  suggestions: []
})

// 显示解析详情
const showParseDetails = ref(false)

// 题目质量检测
const qualityCheck = reactive({
  checked: false,
  score: 0,
  issues: []
})

// 相关题目推荐
const relatedQuestions = ref([])

// 收藏状态
const isFavorited = ref(false)

// AI智能建议
const aiSuggestions = ref([])

// 智能搜索策略推荐
const smartRecommendation = reactive({
  strategy: '',
  reason: '',
  confidence: 0
})

// 实时预测
const predictions = ref([])
const showPredictions = ref(false)

const searchForm = reactive({
  question: '',
  type: '',
  options: '',
  concurrent: false, // 默认关闭并发模式
  strategy: 'first_success'
})

// 搜索历史
const searchHistory = ref(JSON.parse(localStorage.getItem('ai-search-history') || '[]'))

// 搜索进度
const searchProgress = reactive({
  percentage: 0,
  text: '准备搜索...',
  status: '',
  tip: '正在初始化AI搜索引擎'
})

const searchRules = {
  question: [
    { required: true, message: '请输入题目内容', trigger: 'blur' },
    { min: 5, message: '题目内容至少5个字符', trigger: 'blur' }
  ]
}

// 保存当前选项内容，防止手动切换题型时丢失
let savedOptions = ''

// 题目解析方法
const parseQuestionContent = (forceReparse = false) => {
  const content = searchForm.question.trim()
  if (!content) {
    parseResult.detected = false
    return
  }

  // 如果不是强制重新解析且已有选项，保存当前选项
  if (!forceReparse && searchForm.options) {
    savedOptions = searchForm.options
  }

  // 重置解析结果
  parseResult.detected = false
  parseResult.typeName = ''
  parseResult.optionCount = 0

  // 智能识别题型和选项
  const result = smartParseQuestion(content)

  if (result.type) {
    // 自动设置题型
    searchForm.type = result.type
    parseResult.typeName = result.typeName

    // 根据题型处理选项
    if (result.options.length > 0) {
      searchForm.options = result.options.join('\n')
      parseResult.optionCount = result.options.length
      savedOptions = searchForm.options // 更新保存的选项
    } else if (savedOptions && (result.type === 'single' || result.type === 'multiple')) {
      // 如果是选择题但没有检测到选项，使用保存的选项
      searchForm.options = savedOptions
      parseResult.optionCount = savedOptions.split('\n').filter(line => line.trim()).length
    } else {
      // 判断题和填空题清空选项
      searchForm.options = ''
      parseResult.optionCount = 0
    }

    // 清理题目内容（移除选项部分）
    if (result.cleanQuestion) {
      searchForm.question = result.cleanQuestion
    }

    parseResult.detected = true

    // 显示解析提示
    if (result.options.length > 0) {
      ElMessage.success(`已自动识别为${result.typeName}，提取了${result.options.length}个选项`)
    } else {
      ElMessage.success(`已自动识别为${result.typeName}`)
    }
  }
}

// 手动切换题型时的处理
const handleTypeChange = (newType) => {
  const oldType = searchForm.type
  searchForm.type = newType

  // 如果从非选择题切换到选择题，且有保存的选项，恢复选项
  if ((newType === 'single' || newType === 'multiple') &&
      (oldType !== 'single' && oldType !== 'multiple') &&
      savedOptions) {
    searchForm.options = savedOptions
    parseResult.optionCount = savedOptions.split('\n').filter(line => line.trim()).length
    ElMessage.info('已恢复之前的选项内容')
  }

  // 如果从选择题切换到非选择题，保存当前选项并清空
  if ((oldType === 'single' || oldType === 'multiple') &&
      (newType !== 'single' && newType !== 'multiple')) {
    if (searchForm.options) {
      savedOptions = searchForm.options
    }
    searchForm.options = ''
    parseResult.optionCount = 0
  }

  // 更新题型名称
  const typeNames = {
    'single': '单选题',
    'multiple': '多选题',
    'judgement': '判断题',
    'completion': '填空题',
    'short_answer': '简答题',
    'essay': '论述题',
    'calculation': '计算题',
    'programming': '编程题'
  }
  parseResult.typeName = typeNames[newType] || newType
}

const smartParseQuestion = (content) => {
  const result = {
    type: '',
    typeName: '',
    options: [],
    cleanQuestion: ''
  }

  // 首先检测题目中明确标注的题型
  const explicitTypePatterns = [
    { pattern: /(\d+)[\.、]?\s*[\(（]?\s*单选\s*[\)）]?\s*[\(（]?\s*\d+\s*分\s*[\)）]?/i, type: 'single', name: '单选题' },
    { pattern: /(\d+)[\.、]?\s*[\(（]?\s*多选\s*[\)）]?\s*[\(（]?\s*\d+\s*分\s*[\)）]?/i, type: 'multiple', name: '多选题' },
    { pattern: /(\d+)[\.、]?\s*[\(（]?\s*判断\s*[\)）]?\s*[\(（]?\s*\d+\s*分\s*[\)）]?/i, type: 'judgement', name: '判断题' },
    { pattern: /(\d+)[\.、]?\s*[\(（]?\s*填空\s*[\)）]?\s*[\(（]?\s*\d+\s*分\s*[\)）]?/i, type: 'completion', name: '填空题' }
  ]

  // 检查是否有明确的题型标注
  let explicitType = null
  for (const typePattern of explicitTypePatterns) {
    if (typePattern.pattern.test(content)) {
      explicitType = { type: typePattern.type, name: typePattern.name }
      // 清理题目内容，移除题型标注
      content = content.replace(typePattern.pattern, '').trim()
      break
    }
  }

  // 选择题选项模式 (A. B. C. D. 或 A、B、C、D、)
  const optionPatterns = [
    /([A-Z])[.、]\s*([^\n\r]+)/g,  // A. 选项内容 或 A、选项内容
    /([A-Z])\)\s*([^\n\r]+)/g,     // A) 选项内容
    /([A-Z])\s+([^\n\r]+)/g        // A 选项内容
  ]

  let options = []
  let optionPattern = null

  // 尝试匹配选项
  for (const pattern of optionPatterns) {
    const matches = [...content.matchAll(pattern)]
    if (matches.length >= 2) { // 至少2个选项才认为是选择题
      options = matches.map(match => `${match[1]}. ${match[2].trim()}`)
      optionPattern = pattern
      break
    }
  }

  if (options.length >= 2) {
    // 如果有明确的题型标注，优先使用
    if (explicitType && (explicitType.type === 'single' || explicitType.type === 'multiple')) {
      result.type = explicitType.type
      result.typeName = explicitType.name
      result.options = options
    } else {
      // 判断是单选还是多选 - 更全面的关键词检测
      const multipleKeywords = [
        '多选', '多项选择', '多项', '选择正确的', '选择所有', '以下哪些', '包括',
        '哪些', '正确的是', '说法正确的是', '属于', '包含', '涉及', '具有',
        '符合', '满足', '体现', '反映', '表现', '显示', '包括哪些', '有哪些'
      ]

      // 检测多选关键词
      const hasMultipleKeywords = multipleKeywords.some(keyword => content.includes(keyword))

      // 检测题目结构特征（多选题通常选项较多且内容较长）
      const hasMultipleStructure = options.length >= 4 &&
        options.some(opt => opt.length > 20) // 选项内容较长

      // 检测括号形式：（ ） 通常是多选题
      const hasMultipleBrackets = content.includes('（ ） ') || content.includes('( )')

      const isMultiple = hasMultipleKeywords || hasMultipleStructure || hasMultipleBrackets

      result.type = isMultiple ? 'multiple' : 'single'
      result.typeName = isMultiple ? '多选题' : '单选题'
      result.options = options
    }

    // 清理题目内容，移除选项部分
    let cleanContent = content
    if (optionPattern) {
      cleanContent = content.replace(optionPattern, '').trim()
      // 移除多余的换行
      cleanContent = cleanContent.replace(/\n\s*\n/g, '\n').trim()
    }
    result.cleanQuestion = cleanContent

    return result
  }

  // 判断题检测 - 更严格的条件，避免误判
  // 如果有明确的题型标注，优先使用
  if (explicitType && explicitType.type === 'judgement') {
    result.type = explicitType.type
    result.typeName = explicitType.name
    result.cleanQuestion = content
    result.options = []
    return result
  }

  // 只有在没有选项且包含判断题特征时才判定为判断题
  const judgmentKeywords = ['判断题', '判断正误', '判断对错', '正确或错误', '对或错', '√或×']
  const hasStrongJudgmentKeywords = judgmentKeywords.some(keyword => content.includes(keyword))

  // 检测判断题的典型格式：题目后面跟着 () 或 （）
  const hasJudgmentFormat = /[。！？]\s*[\(（]\s*[\)）]/.test(content)

  if ((hasStrongJudgmentKeywords || hasJudgmentFormat) && options.length === 0) {
    result.type = 'judgement'
    result.typeName = '判断题'
    result.cleanQuestion = content
    result.options = [] // 判断题不需要选项
    return result
  }

  // 填空题检测
  const fillBlankPatterns = [
    /_{2,}/g,           // 下划线 ___
    /\(\s*\)/g,         // 空括号 ()
    /\[\s*\]/g,         // 空方括号 []
    /\s+\?\s+/g         // 问号 ?
  ]

  const hasFillBlanks = fillBlankPatterns.some(pattern => pattern.test(content))

  if (hasFillBlanks) {
    result.type = 'completion'
    result.typeName = '填空题'
    result.cleanQuestion = content
    result.options = [] // 填空题不需要选项
    result.reason = '检测到填空符号（下划线、空括号等）'
    result.confidence = 85
    return result
  }

  // 编程题检测
  const programmingKeywords = [
    '编写程序', '编程实现', '代码实现', '算法实现', '函数实现',
    'function', 'def ', 'class ', 'public class', 'int main',
    '输出结果', '运行结果', '程序输出', 'console.log', 'print(',
    'SQL查询', 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  ]

  const hasProgrammingKeywords = programmingKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  )

  if (hasProgrammingKeywords) {
    result.type = 'programming'
    result.typeName = '编程题'
    result.cleanQuestion = content
    result.options = []
    result.reason = '检测到编程相关关键词'
    result.confidence = 80
    return result
  }

  // 计算题检测
  const calculationKeywords = [
    '计算', '求解', '求值', '计算结果', '数值计算',
    '求导', '积分', '微分', '解方程', '求和',
    '概率', '统计', '平均值', '标准差', '方差'
  ]

  const hasCalculationKeywords = calculationKeywords.some(keyword => content.includes(keyword))
  const hasNumbers = /\d+/.test(content)
  const hasMathSymbols = /[+\-*/=<>≤≥∑∫√π]/.test(content)

  if ((hasCalculationKeywords || hasMathSymbols) && hasNumbers) {
    result.type = 'calculation'
    result.typeName = '计算题'
    result.cleanQuestion = content
    result.options = []
    result.reason = '检测到计算关键词和数学符号'
    result.confidence = 75
    return result
  }

  // 简答题检测
  const shortAnswerKeywords = [
    '简述', '简答', '简要说明', '简要回答', '简要分析',
    '列举', '举例说明', '说明', '解释', '阐述',
    '什么是', '如何理解', '怎样理解', '谈谈你的理解'
  ]

  const hasShortAnswerKeywords = shortAnswerKeywords.some(keyword => content.includes(keyword))

  if (hasShortAnswerKeywords) {
    result.type = 'short_answer'
    result.typeName = '简答题'
    result.cleanQuestion = content
    result.options = []
    result.reason = '检测到简答题关键词'
    result.confidence = 70
    return result
  }

  // 论述题检测
  const essayKeywords = [
    '论述', '分析', '评述', '讨论', '谈论',
    '结合实际', '联系实际', '理论联系实际',
    '你认为', '你的观点', '你的看法', '如何看待',
    '试分析', '试论述', '试讨论'
  ]

  const hasEssayKeywords = essayKeywords.some(keyword => content.includes(keyword))
  const isLongContent = content.length > 50

  if (hasEssayKeywords && isLongContent) {
    result.type = 'essay'
    result.typeName = '论述题'
    result.cleanQuestion = content
    result.options = []
    result.reason = '检测到论述题关键词且内容较长'
    result.confidence = 75
    return result
  }

  // 案例分析题检测
  const caseStudyKeywords = [
    '案例分析', '情景分析', '实例分析', '材料分析',
    '根据材料', '根据案例', '阅读材料', '案例：',
    '某公司', '某企业', '某项目', '某同学'
  ]

  const hasCaseStudyKeywords = caseStudyKeywords.some(keyword => content.includes(keyword))

  if (hasCaseStudyKeywords) {
    result.type = 'case_study'
    result.typeName = '案例分析'
    result.cleanQuestion = content
    result.options = []
    result.reason = '检测到案例分析关键词'
    result.confidence = 80
    return result
  }

  return result
}

const handleQuestionInput = () => {
  // 实时解析题目内容和质量检测
  if (searchForm.question.length > 10) {
    parseQuestionContent()
    performQuestionQualityCheck(searchForm.question)
    generateAISuggestions()
    generateSmartRecommendation()
    generatePredictions()
  } else {
    // 重置检测结果
    qualityCheck.checked = false
    parseResult.detected = false
    aiSuggestions.value = []
    predictions.value = []
  }
}

// 处理题目输入框聚焦
const handleQuestionFocus = () => {
  if (searchForm.question.length > 5) {
    generatePredictions()
  }
}

// 生成AI智能建议
const generateAISuggestions = () => {
  const suggestions = []
  const question = searchForm.question.toLowerCase()

  // 语法检查
  if (question.includes('那个') || question.includes('那些')) {
    suggestions.push({
      type: 'grammar',
      title: '语法优化建议',
      description: '建议使用"哪个"或"哪些"替代"那个"或"那些"',
      example: '以下哪个是正确的...',
      action: 'fix_grammar'
    })
  }

  // 选项格式建议
  if ((question.includes('选择') || question.includes('哪个')) &&
      !question.includes('a.') && !question.includes('a、')) {
    suggestions.push({
      type: 'format',
      title: '选项格式建议',
      description: '选择题建议添加标准选项格式',
      example: 'A. 选项1\nB. 选项2\nC. 选项3\nD. 选项4',
      action: 'add_options'
    })
  }

  // 题目完整性检查
  if (question.length < 20 && !question.includes('？') && !question.includes('?')) {
    suggestions.push({
      type: 'completeness',
      title: '题目完整性建议',
      description: '题目可能不完整，建议添加问号并补充更多信息',
      example: '请在题目末尾添加问号',
      action: 'add_question_mark'
    })
  }

  aiSuggestions.value = suggestions
}

// 生成智能搜索策略推荐
const generateSmartRecommendation = () => {
  const question = searchForm.question.toLowerCase()

  // 复杂题目检测关键词
  const complexKeywords = [
    '分析', '论述', '评述', '讨论', '阐述', '解释说明',
    '结合实际', '联系实际', '案例分析', '综合分析',
    '试分析', '试论述', '试讨论', '谈谈你的理解'
  ]

  // 计算类题目关键词
  const calculationKeywords = [
    '计算', '求解', '求值', '编程', '算法', '代码实现',
    '函数实现', '程序设计', 'sql查询', '数据库设计'
  ]

  // 检测题目复杂度
  const isComplex = complexKeywords.some(keyword => question.includes(keyword)) ||
                   question.length > 150
  const isCalculation = calculationKeywords.some(keyword => question.includes(keyword))
  const hasMultipleOptions = (question.match(/[A-Z]\./g) || []).length >= 4

  if (isComplex) {
    smartRecommendation.strategy = 'best_response'
    smartRecommendation.reason = '检测到复杂分析题，建议启用并发模式获得更准确答案'
    smartRecommendation.confidence = 90
  } else if (isCalculation) {
    smartRecommendation.strategy = 'first_success'
    smartRecommendation.reason = '计算类题目答案相对固定，快速响应即可'
    smartRecommendation.confidence = 85
  } else if (hasMultipleOptions && question.length > 80) {
    smartRecommendation.strategy = 'majority_vote'
    smartRecommendation.reason = '多选项复杂题目，建议使用投票策略确保准确性'
    smartRecommendation.confidence = 80
  } else {
    smartRecommendation.strategy = 'first_success'
    smartRecommendation.reason = '简单题目使用快速响应，节省时间和成本'
    smartRecommendation.confidence = 75
  }
}

// 生成实时预测
const generatePredictions = () => {
  const input = searchForm.question.toLowerCase()
  const mockPredictions = []

  // 基于输入内容生成预测
  if (input.includes('vue')) {
    mockPredictions.push({
      text: '以下哪个是Vue.js的核心特性？',
      type: 'single',
      confidence: 92
    })
  }

  if (input.includes('javascript') || input.includes('js')) {
    mockPredictions.push({
      text: 'JavaScript中哪些是原始数据类型？',
      type: 'multiple',
      confidence: 88
    })
  }

  if (input.includes('计算') || input.includes('求')) {
    mockPredictions.push({
      text: '计算函数f(x)=x²+2x+1的导数',
      type: 'calculation',
      confidence: 85
    })
  }

  predictions.value = mockPredictions.slice(0, 3) // 最多显示3个预测
}

// 选择预测建议
const selectPrediction = (prediction) => {
  searchForm.question = prediction.text
  predictions.value = []
  parseQuestionContent()
  ElMessage.success('已选择预测建议')
}

// 应用AI建议
const applySuggestion = (suggestion) => {
  switch (suggestion.action) {
    case 'fix_grammar':
      searchForm.question = searchForm.question
        .replace(/那个/g, '哪个')
        .replace(/那些/g, '哪些')
      break

    case 'add_options':
      if (!searchForm.question.includes('\n')) {
        searchForm.question += '\nA. 选项1\nB. 选项2\nC. 选项3\nD. 选项4'
      }
      break

    case 'add_question_mark':
      if (!searchForm.question.endsWith('？') && !searchForm.question.endsWith('?')) {
        searchForm.question += '？'
      }
      break
  }

  // 重新解析
  parseQuestionContent()
  ElMessage.success('已应用AI建议')
}

// 应用推荐策略
const applyRecommendedStrategy = () => {
  const oldConcurrent = searchForm.concurrent
  const oldStrategy = searchForm.strategy

  if (smartRecommendation.strategy === 'best_response' || smartRecommendation.strategy === 'majority_vote') {
    searchForm.concurrent = true
    searchForm.strategy = smartRecommendation.strategy
  } else {
    searchForm.concurrent = false
    searchForm.strategy = 'first_success'
  }

  // 显示变更提示
  const changes = []
  if (oldConcurrent !== searchForm.concurrent) {
    changes.push(`并发模式: ${searchForm.concurrent ? '启用' : '关闭'}`)
  }
  if (oldStrategy !== searchForm.strategy) {
    const strategyNames = {
      'first_success': '最快响应',
      'best_response': '最佳响应',
      'majority_vote': '多数投票'
    }
    changes.push(`策略: ${strategyNames[searchForm.strategy]}`)
  }

  if (changes.length > 0) {
    ElMessage.success(`已应用AI推荐 (${changes.join(', ')})`)
  } else {
    ElMessage.info('当前设置已是最优配置')
  }
}

// 格式化选项显示
const formatOptions = (optionsText) => {
  if (!optionsText) return []
  return optionsText.split('\n').filter(opt => opt.trim())
}

// 格式化答案显示
const formatAnswer = (answer, optionsText, questionType) => {
  if (!answer || !optionsText) {
    return answer
  }

  // 解析选项映射
  const options = formatOptions(optionsText)
  const optionMap = {}

  options.forEach(option => {
    const trimmed = option.trim()
    if (trimmed) {
      // 匹配 A. 内容 或 A、内容 或 A) 内容 格式
      const match = trimmed.match(/^([A-Z])[.、)\s]+(.+)$/)
      if (match) {
        optionMap[match[1]] = match[2].trim()
      }
    }
  })

  // 处理多选题答案格式化
  if (questionType === 'multiple') {
    // 如果答案已经是#分隔的字母格式（如 "B#C#D"），转换为选项内容
    if (answer.includes('#')) {
      const letters = answer.split('#').map(l => l.trim())
      const contents = letters.map(letter => optionMap[letter]).filter(Boolean)
      if (contents.length > 0) {
        return contents.join('#')
      }
    }

    // 如果答案是逗号分隔的字母格式（如 "B, C, D"），转换为选项内容
    const letterPattern = /^[A-Z](?:\s*[,，]\s*[A-Z])*$/
    if (letterPattern.test(answer.trim())) {
      const letters = answer.split(/[,，]/).map(l => l.trim())
      const contents = letters.map(letter => optionMap[letter]).filter(Boolean)
      if (contents.length > 0) {
        return contents.join('#')
      }
    }
  }

  // 处理单选题答案格式化
  if (questionType === 'single') {
    // 如果答案是单个字母，转换为选项内容
    const singleLetterPattern = /^[A-Z]$/
    if (singleLetterPattern.test(answer.trim())) {
      const content = optionMap[answer.trim()]
      if (content) {
        return content
      }
    }
  }

  return answer
}

// 获取置信度类型
const getConfidenceType = (confidence) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.6) return 'warning'
  return 'danger'
}

// 获取来源名称
const getSourceName = (source) => {
  const sourceMap = {
    'ai_single': 'AI单次搜索',
    'ai_concurrent_1': 'AI并发搜索',
    'ai_concurrent_2': 'AI并发搜索',
    'ai_concurrent_3': 'AI并发搜索',
    'database': '题库匹配',
    'cache': '缓存结果'
  }
  return sourceMap[source] || source
}

// 搜索历史相关方法
const handleHistoryCommand = (command) => {
  if (command.type === 'select') {
    const item = command.data
    searchForm.question = item.question
    searchForm.type = item.type
    searchForm.options = item.options
    parseQuestionContent()
    ElMessage.success('已选择历史题目')
  } else if (command.type === 'clear') {
    searchHistory.value = []
    localStorage.removeItem('ai-search-history')
    ElMessage.success('搜索历史已清空')
  }
}

const addToHistory = (searchData) => {
  const historyItem = {
    question: searchData.question,
    type: searchData.type,
    options: searchData.options,
    timestamp: Date.now()
  }

  // 避免重复
  const exists = searchHistory.value.find(item => item.question === historyItem.question)
  if (!exists) {
    searchHistory.value.unshift(historyItem)
    // 只保留最近20条
    if (searchHistory.value.length > 20) {
      searchHistory.value = searchHistory.value.slice(0, 20)
    }
    localStorage.setItem('ai-search-history', JSON.stringify(searchHistory.value))
  }
}

// 更新搜索进度
const updateSearchProgress = (percentage, text, tip, status = '') => {
  searchProgress.percentage = percentage
  searchProgress.text = text
  searchProgress.tip = tip
  searchProgress.status = status
}

// 获取置信度颜色
const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return '#67c23a'
  if (confidence >= 60) return '#e6a23c'
  return '#f56c6c'
}

// 题目质量检测（使用统一工具函数）
const performQuestionQualityCheck = (question) => {
  const result = checkQuestionQuality(question, parseResult)
  qualityCheck.checked = result.checked
  qualityCheck.score = result.score
  qualityCheck.issues = result.issues
}

// 分享题目
const handleShare = async () => {
  if (!searchResult.value?.success) return

  try {
    const shareData = {
      title: '分享题目',
      text: searchResult.value.question,
      url: window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // 复制到剪贴板
      await navigator.clipboard.writeText(`题目：${searchResult.value.question}\n答案：${searchResult.value.answer}`)
      ElMessage.success('题目内容已复制到剪贴板')
    }
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享失败')
  }
}

// 收藏题目
const handleFavorite = () => {
  if (!searchResult.value?.success) return

  isFavorited.value = !isFavorited.value

  // 这里可以调用API保存收藏状态
  const action = isFavorited.value ? '收藏' : '取消收藏'
  ElMessage.success(`${action}成功`)
}

// 选择相关题目
const selectRelatedQuestion = (question) => {
  searchForm.question = question.question
  searchForm.type = question.type
  searchForm.options = question.options || ''

  // 重新解析题目
  parseQuestionContent()

  ElMessage.info('已选择相关题目，可以重新搜索')
}

// 获取题型颜色
const getTypeColor = (type) => {
  const colorMap = {
    // 选择题
    'single': 'primary',
    'multiple': 'success',
    'judgement': 'warning',
    // 主观题
    'completion': 'info',
    'short_answer': 'primary',
    'essay': 'success',
    'calculation': 'warning',
    'analysis': 'info',
    // 应用题
    'programming': 'danger',
    'design': 'primary',
    'case_study': 'success',
    'experiment': 'warning',
    // 其他
    'ordering': 'info',
    'matching': 'primary',
    'connection': 'success',
    'comprehensive': 'danger'
  }
  return colorMap[type] || 'default'
}

// 获取题型名称
const getTypeName = (type) => {
  const nameMap = {
    'single': '单选题',
    'multiple': '多选题',
    'judgement': '判断题',
    'completion': '填空题',
    'short_answer': '简答题',
    'essay': '论述题',
    'calculation': '计算题',
    'analysis': '分析题',
    'programming': '编程题',
    'design': '设计题',
    'case_study': '案例分析',
    'experiment': '实验题',
    'ordering': '排序题',
    'matching': '匹配题',
    'connection': '连线题',
    'comprehensive': '综合题'
  }
  return nameMap[type] || '未知'
}

// 获取相关题目推荐
const getRelatedQuestions = async (question) => {
  try {
    // 这里可以调用API获取相关题目
    // 暂时使用模拟数据
    const mockRelated = [
      {
        question: 'React的核心特性有哪些？',
        type: 'multiple',
        similarity: 85
      },
      {
        question: '简述JavaScript闭包的概念和应用场景',
        type: 'short_answer',
        similarity: 82
      },
      {
        question: '编写一个函数实现深拷贝',
        type: 'programming',
        similarity: 78
      },
      {
        question: '计算时间复杂度：O(n²)算法的性能分析',
        type: 'calculation',
        similarity: 75
      },
      {
        question: '某网站性能优化案例分析',
        type: 'case_study',
        similarity: 72
      },
      {
        question: 'CSS中___属性用于设置元素的显示方式',
        type: 'completion',
        similarity: 68
      }
    ]

    relatedQuestions.value = mockRelated
  } catch (error) {
    console.error('获取相关题目失败:', error)
  }
}

// 方法
const handleSearch = async () => {
  if (!searchFormRef.value) return

  try {
    const valid = await searchFormRef.value.validate()
    if (!valid) return

    searching.value = true
    searchResult.value = null // 清除之前的结果
    const startTime = Date.now()

    // 初始化搜索进度
    updateSearchProgress(10, '正在准备搜索...', '初始化AI搜索引擎')

    // 模拟搜索进度
    const progressTimer = setInterval(() => {
      if (searchProgress.percentage < 80) {
        searchProgress.percentage += 10
        if (searchProgress.percentage === 30) {
          updateSearchProgress(30, '正在连接AI服务...', '选择最佳代理服务器')
        } else if (searchProgress.percentage === 50) {
          updateSearchProgress(50, '正在分析题目...', 'AI正在理解题目内容')
        } else if (searchProgress.percentage === 70) {
          updateSearchProgress(70, '正在生成答案...', 'AI正在推理和计算')
        }
      }
    }, 500)

    // 根据题型决定是否包含选项
    const shouldIncludeOptions = ['single', 'multiple'].includes(searchForm.type)

    const params = {
      question: searchForm.question,
      type: searchForm.type,
      options: shouldIncludeOptions ? searchForm.options : '',
      concurrent: searchForm.concurrent,
      strategy: searchForm.strategy
    }

    const response = await searchQuestion(params)
    clearInterval(progressTimer)
    updateSearchProgress(100, '搜索完成！', '答案已生成', 'success')

    searchTime.value = Date.now() - startTime

    searchResult.value = {
      success: response.success,
      question: response.data?.question || searchForm.question,
      answer: response.data?.answer || '',
      confidence: response.data?.confidence || 0,
      source: response.data?.source || '',
      message: response.message
    }

    if (response.success) {
      // 添加到搜索历史
      addToHistory({
        question: searchForm.question,
        type: searchForm.type,
        options: searchForm.options
      })
      ElMessage.success(`搜索成功！用时 ${(searchTime.value / 1000).toFixed(1)} 秒`)

      // 获取相关题目推荐
      getRelatedQuestions(searchForm.question)
    } else {
      updateSearchProgress(100, '搜索失败', '未找到答案', 'exception')
      ElMessage.warning(response.message || '未找到答案')
    }

  } catch (error) {
    clearInterval(progressTimer)
    updateSearchProgress(100, '搜索失败', '发生错误', 'exception')

    console.error('搜索错误:', error)
    searchResult.value = {
      success: false,
      message: error.message || '搜索失败'
    }

    // 根据错误类型提供不同的提示
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('搜索超时，请检查网络连接或稍后重试')
    } else if (error.message?.includes('timeout')) {
      ElMessage.error('AI搜索超时，请尝试简化问题或稍后重试')
    } else {
      ElMessage.error(error.message || '搜索失败，请稍后重试')
    }
  } finally {
    searching.value = false
    // 延迟隐藏进度条
    setTimeout(() => {
      if (!searching.value) {
        searchProgress.percentage = 0
      }
    }, 2000)
  }
}

const handleReset = () => {
  searchFormRef.value?.resetFields()
  searchResult.value = null
}

const handleExample = () => {
  const examples = [
    // 单选题
    '以下哪个是Vue.js的核心特性？\nA. 双向数据绑定\nB. 虚拟DOM\nC. 组件化\nD. 以上都是',

    // 多选题
    'Python中哪些是可变数据类型？\nA. 列表(list)\nB. 元组(tuple)\nC. 字典(dict)\nD. 集合(set)',

    // 判断题
    'HTTP协议是无状态协议。（）',

    // 填空题
    'JavaScript中声明变量使用___关键字，ES6新增了___和___两种声明方式。',

    // 简答题
    '简述面向对象编程的三大特性及其作用。',

    // 计算题
    '计算函数f(x)=x²+2x+1在x=3时的值，并求出该函数的最小值。',

    // 编程题
    '编写一个JavaScript函数，实现数组去重功能。要求：\n1. 支持数字和字符串类型\n2. 保持原数组顺序\n3. 返回新数组',

    // 案例分析
    '某电商网站在双11期间出现大量用户访问缓慢的问题，请从技术角度分析可能的原因并提出解决方案。'
  ]

  // 随机选择一个示例
  const randomExample = examples[Math.floor(Math.random() * examples.length)]
  searchForm.question = randomExample

  // 触发智能解析
  parseQuestionContent()

  ElMessage.success('已加载示例题目，系统会自动识别题型')
}

const handleSave = async () => {
  if (!searchResult.value?.success) return

  try {
    await saveQuestion({
      question: searchResult.value.question,
      answer: searchResult.value.answer,
      type: searchForm.type,
      options: searchForm.options
    })

    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

const handleCopy = async () => {
  if (!searchResult.value?.answer) return

  try {
    await navigator.clipboard.writeText(searchResult.value.answer)
    ElMessage.success('答案已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleRetry = () => {
  handleSearch()
}


</script>

<style lang="scss" scoped>
.ai-search-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-card,
.result-card,
.history-card {
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

.parse-hint {
  margin-top: 8px;

  .el-tag {
    .el-icon {
      margin-right: 4px;
    }
  }
}

.result-content {
  .question-section,
  .options-section,
  .answer-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 10px 0;
      color: var(--el-text-color-primary);
    }
  }

  .question-text {
    padding: 12px;
    background: var(--el-bg-color-page);
    border-radius: 4px;
    white-space: pre-wrap;
  }

  .options-list {
    .option-item {
      padding: 8px 12px;
      margin-bottom: 6px;
      background: var(--el-bg-color-page);
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .answer-text {
    padding: 12px;
    background: var(--el-color-success-light-9);
    border: 1px solid var(--el-color-success-light-7);
    border-radius: 4px;
    font-weight: 500;
    white-space: pre-wrap;

    &.highlight {
      animation: highlight 2s ease-in-out;
    }
  }

  .actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
  }
}

.error-content {
  text-align: center;
}

.history-list {
  .history-item {
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .history-question {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .history-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

@keyframes highlight {
  0% { background: var(--el-color-success-light-7); }
  50% { background: var(--el-color-success-light-5); }
  100% { background: var(--el-color-success-light-9); }
}

@media (max-width: 768px) {
  .ai-search-container {
    padding: 10px;
  }

  .actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}

/* 新增样式 */
.progress-card {
  margin-top: 20px;
}

.search-progress {
  text-align: center;
  padding: 20px;
}

.progress-content {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.progress-content .rotating {
  margin-right: 10px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-color-primary);
}

.progress-tips {
  margin-top: 10px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.answer-meta {
  display: flex;
  gap: 8px;
}

/* 新增样式 */
.parse-details {
  margin-top: 12px;
}

.parse-details-card {
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
}

.parse-info {
  .parse-item {
    margin-bottom: 12px;

    .label {
      font-weight: 500;
      margin-right: 8px;
      color: var(--el-text-color-regular);
    }
  }

  .suggestions-list {
    margin: 8px 0 0 16px;

    li {
      margin-bottom: 4px;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }
}

.quality-check {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
}

.quality-score {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  .label {
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  .score-text {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.quality-issues {
  margin-top: 8px;

  ul {
    margin: 8px 0 0 0;
    padding-left: 16px;

    li {
      margin-bottom: 4px;
      font-size: 14px;
    }
  }
}

.related-questions {
  margin-top: 24px;

  h4 {
    margin: 0 0 16px 0;
    color: var(--el-text-color-primary);
    font-size: 16px;
  }
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.related-content {
  flex: 1;

  .related-question {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .related-meta {
    display: flex;
    align-items: center;
    gap: 12px;

    .similarity {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.related-arrow {
  color: var(--el-text-color-placeholder);
  transition: color 0.3s ease;

  .related-item:hover & {
    color: var(--el-color-primary);
  }
}
</style>
