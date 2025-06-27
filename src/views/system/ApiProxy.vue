<template>
  <div class="api-proxy-management">

    <!-- API代理池状态概览 -->
    <el-row :gutter="20" class="status-overview">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(stat, index) in apiProxyStats" :key="index">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon>
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'positive' : 'negative'">
            <el-icon>
              <TrendCharts v-if="stat.trend > 0" />
              <Bottom v-else />
            </el-icon>
            <span>{{ Math.abs(stat.trend) }}%</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作工具栏 -->
    <el-card class="toolbar-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Setting />
          </el-icon>
          <span>API代理管理</span>
        </div>
      </template>

      <div class="operations-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="showAddDialog" :icon="Plus">添加API代理</el-button>
          <el-button type="success" @click="reloadConfig" :icon="Refresh">重载配置</el-button>
          <el-button type="warning" @click="batchHealthCheck" :icon="CircleCheck">健康检查</el-button>
          <el-button type="danger" @click="batchOperation('deactivate')" :icon="Close"
            :disabled="!selectedProxies.value || selectedProxies.value.length === 0">
            批量禁用
          </el-button>
          <el-dropdown split-button type="info" @command="handleMoreOperations">
            更多操作
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="export">导出配置</el-dropdown-item>
                <el-dropdown-item command="import">导入配置</el-dropdown-item>
                <el-dropdown-item command="alertRules">告警规则</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="toolbar-right">
          <el-input v-model="searchKeyword" placeholder="搜索API代理..." style="width: 200px" @keyup.enter="loadApiProxies">
            <template #append>
              <el-button @click="loadApiProxies" :icon="Search" />
            </template>
          </el-input>
        </div>
      </div>
    </el-card>

    <!-- API代理列表 -->
    <el-card class="proxy-list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Connection />
          </el-icon>
          <span>API代理列表</span>
          <div class="header-actions">
            <el-radio-group v-model="statusFilter" size="small" @change="loadApiProxies">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="active">活跃</el-radio-button>
              <el-radio-button value="inactive">非活跃</el-radio-button>
              <el-radio-button value="healthy">健康</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="apiProxyList" v-loading="tableLoading" @selection-change="handleSelectionChange" stripe border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="代理名称" min-width="150" />
        <el-table-column prop="api_base" label="API地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="model" label="默认模型" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? (row.is_healthy ? 'success' : 'warning') : 'danger'" size="small">
              {{ row.is_active ? (row.is_healthy ? '健康' : '异常') : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="key_count" label="密钥数" width="80" />
        <el-table-column prop="success_rate" label="成功率" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.success_rate" :color="getSuccessRateColor(row.success_rate)"
              :show-text="false" :stroke-width="8" />
            <span class="success-rate-text">{{ row.success_rate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="avg_response_time" label="响应时间" width="100">
          <template #default="{ row }">
            {{ row.avg_response_time }}ms
          </template>
        </el-table-column>
        <el-table-column prop="last_used_str" label="最后使用" width="150" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="testApiProxy(row)" :loading="row.testing"
              :icon="CircleCheck">
              测试
            </el-button>
            <el-button type="primary" size="small" @click="toggleProxyStatus(row)"
              :icon="row.is_active ? VideoPause : VideoPlay">
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button type="warning" size="small" @click="resetProxyErrors(row)" :icon="Refresh">
              重置
            </el-button>
            <el-button type="info" size="small" @click="viewProxyDetail(row)" :icon="View">
              详情
            </el-button>
            <el-button type="warning" size="small" @click="showEditDialog(row)" :icon="Edit">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteApiProxyConfirm(row)" :icon="Delete">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadApiProxies" @current-change="loadApiProxies" />
      </div>
    </el-card>

    <!-- 添加API代理对话框 -->
    <el-dialog v-model="addDialogVisible" :title="isEditing ? '编辑API代理' : '添加API代理'" width="600px">
      <el-form :model="apiProxyForm" :rules="apiProxyRules" ref="apiProxyFormRef" label-width="100px">
        <el-form-item label="代理名称" prop="name">
          <el-input v-model="apiProxyForm.name" placeholder="请输入代理名称" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="API地址" prop="api_base">
          <el-input v-model="apiProxyForm.api_base" placeholder="https://api.example.com" />
        </el-form-item>
        <el-form-item label="API密钥" prop="api_keys">
          <el-input v-model="apiKeysText" placeholder="请输入API密钥" type="password" show-password />
        </el-form-item>

        <!-- 智能模型发现 -->
        <el-form-item>
          <div class="discover-models-section">
            <el-button
              type="primary"
              :loading="discoveringModels"
              @click="discoverModels"
              :disabled="!apiProxyForm.api_base || !apiKeysText"
              size="small"
              class="discover-btn"
            >
              <template #icon>
                <el-icon><Search /></el-icon>
              </template>
              {{ discoveringModels ? '正在发现模型...' : '智能发现模型' }}
            </el-button>
            <div class="discover-tip">
              <el-icon><InfoFilled /></el-icon>
              根据API和密钥自动获取支持的模型并测试可用性，智能选择最佳模型
            </div>
          </div>
        </el-form-item>
        <el-form-item label="默认模型" prop="model">
          <el-select v-model="apiProxyForm.model" placeholder="选择默认模型" filterable allow-create style="width: 100%">
            <el-option
              v-for="model in apiProxyForm.available_models.length ? apiProxyForm.available_models : availableModels"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
          <div class="form-tip">
            <span v-if="apiProxyForm.available_models.length > 0" style="color: #67c23a;">
              ✅ 已发现 {{ apiProxyForm.available_models.length }} 个可用模型
            </span>
            <span v-else style="color: #e6a23c;">
              💡 建议先点击"智能发现模型"按钮自动获取和测试可用模型
            </span>
          </div>
        </el-form-item>
        <el-form-item label="支持模型" prop="models">
          <el-select
            v-model="apiProxyForm.models"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入支持的模型"
            style="width: 100%"
            @change="handleModelsChange"
          >
            <el-option
              v-for="model in availableModels"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
          <div class="form-tip">可以选择多个模型，也可以手动输入新模型名称</div>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="apiProxyForm.priority" :min="1" :max="100" />
          <div class="form-tip">数字越小优先级越高</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="apiProxyForm.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveApiProxy" :loading="saving">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 代理详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="API代理详情" width="800px">
      <div v-if="selectedProxy" class="proxy-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="代理名称">{{ selectedProxy.name }}</el-descriptions-item>
          <el-descriptions-item label="API地址">{{ selectedProxy.api_base }}</el-descriptions-item>
          <el-descriptions-item label="默认模型">{{ selectedProxy.model }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ selectedProxy.priority }}</el-descriptions-item>
          <el-descriptions-item label="密钥数量">{{ selectedProxy.key_count }}</el-descriptions-item>
          <el-descriptions-item label="当前密钥">{{ selectedProxy.current_key }}</el-descriptions-item>
          <el-descriptions-item label="成功次数">{{ selectedProxy.success_count }}</el-descriptions-item>
          <el-descriptions-item label="错误次数">{{ selectedProxy.error_count }}</el-descriptions-item>
          <el-descriptions-item label="连续错误">{{ selectedProxy.consecutive_errors }}</el-descriptions-item>
          <el-descriptions-item label="成功率">{{ selectedProxy.success_rate }}%</el-descriptions-item>
          <el-descriptions-item label="平均响应时间">{{ selectedProxy.avg_response_time }}ms</el-descriptions-item>
          <el-descriptions-item label="运行时间">{{ formatUptime(selectedProxy.uptime) }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>支持的模型</el-divider>
        <el-tag v-for="model in selectedProxy.models" :key="model" class="model-tag">
          {{ model }}
        </el-tag>
        
        <el-divider>可用的模型</el-divider>
        <div class="available-models-section">
          <div class="models-list">
            <el-tag 
              v-for="model in selectedProxy.available_models" 
              :key="model" 
              class="model-tag"
              type="success"
            >
              {{ model }}
            </el-tag>
            <div v-if="!selectedProxy.available_models || selectedProxy.available_models.length === 0" class="no-models-tip">
              暂无可用模型，请进行测试
            </div>
          </div>
          <div class="models-actions">
            <el-button type="primary" size="small" @click="testModelsAvailability(selectedProxy)" :loading="testingModels">
              测试模型可用性
            </el-button>
            <el-tooltip content="可以指定要测试的模型数量，避免测试过多模型导致超时">
              <el-input-number v-model="maxTestCount" :min="1" :max="50" size="small" style="width: 120px; margin-left: 10px;" />
            </el-tooltip>
          </div>
        </div>
        
        <el-divider>优先级设置</el-divider>
        <div class="priority-setting">
          <el-input-number v-model="proxyPriority" :min="1" :max="100" size="small" />
          <el-button type="primary" size="small" @click="updateProxyPriority" :loading="updatingPriority">
            更新优先级
          </el-button>
          <div class="form-tip">数字越小优先级越高</div>
        </div>
      </div>
    </el-dialog>

    <!-- 导入配置对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入API代理配置" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".json"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 .json 格式的配置文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importConfig" :loading="importing">导入</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 告警规则对话框 -->
    <el-dialog v-model="alertRulesDialogVisible" title="API代理告警规则" width="600px">
      <el-form :model="alertRules" label-width="180px">
        <el-form-item label="启用告警">
          <el-switch v-model="alertRules.alert_enabled" />
        </el-form-item>
        <el-form-item label="成功率阈值 (%)">
          <el-slider v-model="alertRules.success_rate_threshold" :min="50" :max="100" :step="1" show-input />
          <div class="form-tip">成功率低于此值将触发告警</div>
        </el-form-item>
        <el-form-item label="响应时间阈值 (毫秒)">
          <el-input-number v-model="alertRules.response_time_threshold" :min="500" :max="30000" :step="100" />
          <div class="form-tip">响应时间高于此值将触发告警</div>
        </el-form-item>
        <el-form-item label="连续错误阈值">
          <el-input-number v-model="alertRules.consecutive_errors_threshold" :min="1" :max="20" :step="1" />
          <div class="form-tip">连续错误次数达到此值将触发告警</div>
        </el-form-item>
        <el-form-item label="通知邮箱">
          <el-input v-model="alertRules.notification_email" placeholder="多个邮箱用逗号分隔" />
        </el-form-item>
        <el-form-item label="Webhook URL">
          <el-input v-model="alertRules.notification_webhook" placeholder="HTTP/HTTPS URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="alertRulesDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAlertRules" :loading="savingAlertRules">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 模型测试进度对话框 -->
    <el-dialog
      v-model="testProgressDialogVisible"
      title="模型测试进度"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="test-progress-content">
        <div class="progress-header">
          <h4>正在测试代理: {{ currentTestingProxy }}</h4>
          <el-progress
            :percentage="testProgressPercentage"
            :status="testProgressStatus"
            :stroke-width="8"
            class="mb-3"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
            </template>
          </el-progress>
          <p class="progress-text">{{ testProgressText }}</p>
        </div>

        <div class="models-test-list">
          <el-table
            :data="modelTestResults"
            border
            height="400"
            :show-header="true"
          >
            <el-table-column prop="model" label="模型名称" min-width="200" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="getModelTestStatusType(row.status)"
                  size="small"
                >
                  {{ getModelTestStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="response_time" label="响应时间" width="100">
              <template #default="{ row }">
                <span v-if="row.response_time">{{ row.response_time }}ms</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status_code" label="响应码" width="100">
              <template #default="{ row }">
                <span v-if="row.status_code" :class="getStatusCodeClass(row.status_code)">
                  {{ row.status_code }}
                </span>
                <span v-else class="status-code-empty">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="结果" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>

        <div class="test-summary" v-if="testCompleted">
          <el-divider>测试汇总</el-divider>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总模型数" :value="totalModels" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已测试" :value="testedModels" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="可用模型" :value="availableModelsCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="成功率" :value="successRate" suffix="%" />
            </el-col>
          </el-row>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="testProgressDialogVisible = false" :disabled="!testCompleted">
            {{ testCompleted ? '关闭' : '测试中...' }}
          </el-button>
        </span>
      </template>
    </el-dialog>




  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  CircleCheck,
  Close,
  Search,
  VideoPause,
  VideoPlay,
  View,
  Edit,
  Delete,
  InfoFilled
} from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'

import {
  addApiProxy as addApiProxyApi,
  batchApiProxyOperation,
  deleteApiProxy as deleteApiProxyApi,
  exportApiProxyConfig,
  getApiProxyAlertRules,
  getApiProxyDetail,
  getApiProxyList,
  getApiProxyStatus,
  getSupportedModels,
  discoverModelsFromApi,
  importApiProxyConfig,
  reloadApiProxyConfig,
  resetApiProxyErrors,
  setApiProxyAlertRules,
  setApiProxyPriority,
  testModelAvailability,
  triggerApiProxyHealthCheck,
  updateApiProxy as updateApiProxyApi,
  updateApiProxyStatus,
  updateAvailableModelsConfig,
  getTestProgress
} from '@/api/proxy'

// 响应式数据
const tableLoading = ref(false)
const addDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const saving = ref(false)
const updatingPriority = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('all')
const selectedProxies = ref([])
const selectedProxy = ref(null)
const proxyPriority = ref(1)
const isEditing = ref(false)
const originalProxyName = ref('')
const availableModels = ref([])

const apiProxyStats = ref([
  {
    label: '总代理数',
    value: '0',
    icon: 'Connection',
    color: '#409eff',
    trend: 0
  },
  {
    label: '活跃代理',
    value: '0',
    icon: 'SuccessFilled',
    color: '#67c23a',
    trend: 0
  },
  {
    label: '平均响应时间',
    value: '0ms',
    icon: 'Timer',
    color: '#e6a23c',
    trend: 0
  },
  {
    label: '整体成功率',
    value: '0%',
    icon: 'TrendCharts',
    color: '#f56c6c',
    trend: 0
  }
])

const apiProxyList = ref([])

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const apiProxyForm = reactive({
  name: '',
  api_base: '',
  api_keys: [],
  model: '',
  models: [],
  available_models: [],
  priority: 1,
  is_active: true
})

const apiKeysText = ref('')
const modelsText = ref('')

const apiProxyFormRef = ref()

const apiProxyRules = {
  name: [
    { required: true, message: '请输入代理名称', trigger: 'blur' }
  ],
  api_base: [
    { required: true, message: '请输入API地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入默认模型', trigger: 'blur' }
  ]
}

// 计算属性
const getSuccessRateColor = (rate) => {
  if (rate >= 90) return '#67c23a'
  if (rate >= 70) return '#e6a23c'
  return '#f56c6c'
}

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

// 方法
const loadApiProxyStatus = async () => {
  try {
    const response = await getApiProxyStatus()
    if (response.success) {
      const data = response.data
      apiProxyStats.value[0].value = data.total_proxies.toString()
      apiProxyStats.value[1].value = data.active_proxies.toString()
      apiProxyStats.value[2].value = `${data.avg_response_time}ms`
      apiProxyStats.value[3].value = `${data.overall_success_rate}%`
    }
  } catch (error) {
    console.error('加载API代理状态失败:', error)
  }
}

const loadAvailableModels = async () => {
  try {
    const response = await getSupportedModels()
    if (response.success) {
      // 获取所有支持的模型
      availableModels.value = response.data.models

      // 如果没有获取到模型，使用默认列表
      if (!availableModels.value || availableModels.value.length === 0) {
        availableModels.value = [
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'gpt-4-turbo-preview',
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k',
          'claude-3-opus',
          'claude-3-sonnet',
          'claude-3-haiku',
          'claude-2',
          'gemini-pro',
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'llama-3-70b',
          'llama-3-8b',
          'mistral-large',
          'mistral-medium',
          'mistral-small',
          'qwen-max',
          'qwen-plus',
          'qwen-turbo',
          'glm-4',
          'deepseek-coder',
          'deepseek-chat'
        ]
      }
    }
  } catch (error) {
    console.error('加载支持模型列表失败:', error)
  }
}

const loadApiProxies = async () => {
  tableLoading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.size,
      status: statusFilter.value,
      search: searchKeyword.value
    }

    const response = await getApiProxyList(params)
    if (response.success) {
      apiProxyList.value = response.data.proxies
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('加载API代理列表失败')
    console.error('加载API代理列表失败:', error)
  } finally {
    tableLoading.value = false
  }
}

const showAddDialog = () => {
  // 重置表单
  Object.assign(apiProxyForm, {
    name: '',
    api_base: '',
    api_keys: [],
    model: '',
    models: [],
    available_models: [],
    priority: 1,
    is_active: true
  })
  apiKeysText.value = ''
  modelsText.value = ''
  isEditing.value = false
  originalProxyName.value = ''
  addDialogVisible.value = true
}

const showEditDialog = async (proxy) => {
  try {
    // 先获取完整的API代理详情，包括完整的API密钥
    const response = await getApiProxyDetail(proxy.name)
    if (!response.success) {
      ElMessage.error(response.message || '获取API代理详情失败')
      return
    }
    
    const proxyDetail = response.data
    
    // 填充表单
    Object.assign(apiProxyForm, {
      name: proxyDetail.name,
      api_base: proxyDetail.api_base,
      api_keys: proxyDetail.api_keys || [],
      model: proxyDetail.model,
      models: proxyDetail.models || [],
      available_models: proxyDetail.available_models || [],
      priority: proxyDetail.priority,
      is_active: proxyDetail.is_active
    })
    
    // 设置API密钥 - 现在只使用第一个密钥
    apiKeysText.value = proxyDetail.api_keys && proxyDetail.api_keys.length > 0 ? proxyDetail.api_keys[0] : ''
    isEditing.value = true
    originalProxyName.value = proxy.name
    addDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取API代理详情失败')
    console.error('获取API代理详情失败:', error)
  }
}

const saveApiProxy = async () => {
  if (!apiProxyFormRef.value) return

  try {
    const valid = await apiProxyFormRef.value.validate()
    if (!valid) return

    saving.value = true

    // 处理API密钥 - 现在只有一个密钥
    apiProxyForm.api_keys = apiKeysText.value.trim() ? [apiKeysText.value.trim()] : []

    if (apiProxyForm.api_keys.length === 0) {
      ElMessage.error('请输入API密钥')
      return
    }

    if (!apiProxyForm.models || apiProxyForm.models.length === 0) {
      ElMessage.error('请至少选择一个支持的模型')
      return
    }

    // 确保默认模型在支持模型列表中
    if (!apiProxyForm.models.includes(apiProxyForm.model)) {
      apiProxyForm.models.push(apiProxyForm.model)
    }

    let response
    if (isEditing.value) {
      // 更新现有代理
      response = await updateApiProxyApi(originalProxyName.value, apiProxyForm)
    } else {
      // 添加新代理
      response = await addApiProxyApi(apiProxyForm)
    }

    if (response.success) {
      ElMessage.success(isEditing.value ? 'API代理更新成功' : 'API代理添加成功')
      addDialogVisible.value = false
      loadApiProxies()
      loadApiProxyStatus()
    } else {
      ElMessage.error(response.message || (isEditing.value ? '更新API代理失败' : '添加API代理失败'))
    }
  } catch (error) {
    ElMessage.error(isEditing.value ? '更新API代理失败' : '添加API代理失败')
    console.error(isEditing.value ? '更新API代理失败:' : '添加API代理失败:', error)
  } finally {
    saving.value = false
  }
}

const toggleProxyStatus = async (proxy) => {
  try {
    const newStatus = !proxy.is_active
    const response = await updateApiProxyStatus(proxy.name, newStatus)
    if (response.success) {
      proxy.is_active = newStatus
      ElMessage.success(`API代理已${newStatus ? '启用' : '禁用'}`)
      loadApiProxyStatus()
    } else {
      ElMessage.error(response.message || '更新代理状态失败')
    }
  } catch (error) {
    ElMessage.error('更新代理状态失败')
    console.error('更新代理状态失败:', error)
  }
}

const resetProxyErrors = async (proxy) => {
  try {
    const response = await resetApiProxyErrors(proxy.name)
    if (response.success) {
      ElMessage.success('错误计数已重置')
      loadApiProxies()
    } else {
      ElMessage.error(response.message || '重置错误计数失败')
    }
  } catch (error) {
    ElMessage.error('重置错误计数失败')
    console.error('重置错误计数失败:', error)
  }
}

const testApiProxy = async (proxy) => {
  if (!proxy.name) return

  proxy.testing = true

  // 显示进度对话框
  showTestProgressDialog(proxy)

  try {
    // 开始轮询进度
    startProgressPolling(proxy.name)

    // 测试所有模型
    const response = await testModelAvailability(proxy.name, {
      max_test_count: 9999, // 测试所有模型
      timeout_per_model: 60,
      max_concurrent: 2 // 并发测试2个模型
    })

    if (response.success) {
      const totalTested = response.data.results.length
      const totalAvailable = response.data.available_models.length
      const calculatedSuccessRate = totalTested > 0 ? Math.round((totalAvailable / totalTested) * 100) : 0

      // 更新进度对话框显示最终结果
      updateTestProgress(response.data.results, totalTested, totalAvailable, calculatedSuccessRate)

      ElMessage.success(`代理 ${proxy.name} 测试完成！${totalAvailable}/${totalTested} 模型可用 (${calculatedSuccessRate}%)`)

      // 自动更新配置文件
      if (totalAvailable > 0) {
        try {
          const updateResponse = await updateAvailableModelsConfig({
            [proxy.name]: {
              status: 'completed',
              available_models: response.data.available_models
            }
          })

          if (updateResponse.success) {
            ElMessage.success(`配置文件已更新，代理 ${proxy.name} 的可用模型已保存`)
          } else {
            ElMessage.warning(`模型测试成功，但配置更新失败: ${updateResponse.message}`)
          }
        } catch (error) {
          ElMessage.warning('模型测试成功，但配置更新失败')
          console.error('更新配置失败:', error)
        }
      }

      // 重新加载数据以获取最新状态
      await loadApiProxies()

      // 如果编辑对话框是打开的，并且正在编辑当前测试的代理，则更新编辑表单
      if (addDialogVisible.value && isEditing.value && apiProxyForm.name === proxy.name) {
        console.log('刷新编辑表单:', proxy.name)
        await refreshEditForm(proxy.name)
      }
    } else {
      ElMessage.error(response.message || '模型测试失败')
      testProgressStatus.value = 'exception'
      testProgressText.value = '测试失败'
    }
  } catch (error) {
    ElMessage.error('模型测试失败')
    console.error('模型测试失败:', error)
    testProgressStatus.value = 'exception'
    testProgressText.value = '测试异常'
  } finally {
    proxy.testing = false
    testCompleted.value = true
    stopProgressPolling() // 停止轮询
  }
}

// 显示测试进度对话框
const showTestProgressDialog = (proxy) => {
  currentTestingProxy.value = proxy.name
  testProgressDialogVisible.value = true
  testProgressPercentage.value = 0
  testProgressStatus.value = ''
  testProgressText.value = '准备开始测试...'
  modelTestResults.value = []
  testCompleted.value = false

  // 初始化模型列表为等待状态
  const models = proxy.models || []
  totalModels.value = models.length
  testedModels.value = 0
  availableModelsCount.value = 0
  successRate.value = 0

  modelTestResults.value = models.map(model => ({
    model,
    status: 'waiting',
    response_time: null,
    message: '等待测试...'
  }))

  // 初始化进度显示
  testProgressText.value = `准备测试 ${models.length} 个模型...`
  testProgressPercentage.value = 0
}



// 更新测试进度（显示最终结果）
const updateTestProgress = (results, total, available, rate) => {
  testProgressPercentage.value = 100
  testProgressStatus.value = 'success'
  testProgressText.value = `测试完成！${available}/${total} 模型可用`

  testedModels.value = total
  availableModelsCount.value = available
  successRate.value = rate

  // 更新每个模型的测试结果
  modelTestResults.value = results.map(result => ({
    model: result.model,
    status: result.success ? 'success' : 'failed',
    status_code: result.status_code,
    response_time: result.response_time,
    message: result.message || (result.success ? '测试成功' : '测试失败')
  }))
}

// 刷新编辑表单数据
const refreshEditForm = async (proxyName) => {
  try {
    const response = await getApiProxyDetail(proxyName)
    if (response.success) {
      const proxyDetail = response.data

      // 只更新 available_models 字段，保持其他字段不变
      apiProxyForm.available_models = proxyDetail.available_models || []

      ElMessage.success('编辑表单已更新最新的可用模型列表')
    }
  } catch (error) {
    console.error('刷新编辑表单失败:', error)
  }
}

const deleteApiProxyConfirm = async (proxy) => {
  try {
    await ElMessageBox.confirm(`确定要删除API代理 "${proxy.name}" 吗？`, '提示', {
      type: 'warning'
    })

    const response = await deleteApiProxyApi(proxy.name)
    if (response.success) {
      ElMessage.success('API代理删除成功')
      loadApiProxies()
      loadApiProxyStatus()
    } else {
      ElMessage.error(response.message || '删除API代理失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除API代理失败')
      console.error('删除API代理失败:', error)
    }
  }
}

const viewProxyDetail = (proxy) => {
  selectedProxy.value = proxy
  proxyPriority.value = proxy.priority
  detailDialogVisible.value = true
}

const updateProxyPriority = async () => {
  if (!selectedProxy.value) return
  
  updatingPriority.value = true
  try {
    const response = await setApiProxyPriority(selectedProxy.value.name, proxyPriority.value)
    if (response.success) {
      ElMessage.success('代理优先级更新成功')
      selectedProxy.value.priority = proxyPriority.value
      loadApiProxies()
    } else {
      ElMessage.error(response.message || '更新代理优先级失败')
    }
  } catch (error) {
    ElMessage.error('更新代理优先级失败')
    console.error('更新代理优先级失败:', error)
  } finally {
    updatingPriority.value = false
  }
}

const reloadConfig = async () => {
  try {
    const response = await reloadApiProxyConfig()
    if (response.success) {
      ElMessage.success('配置重载成功')
      loadApiProxies()
      loadApiProxyStatus()
    } else {
      ElMessage.error(response.message || '配置重载失败')
    }
  } catch (error) {
    ElMessage.error('配置重载失败')
    console.error('配置重载失败:', error)
  }
}

const batchHealthCheck = async () => {
  try {
    const response = await triggerApiProxyHealthCheck()
    if (response.success) {
      ElMessage.success(response.message)
      loadApiProxies()
      loadApiProxyStatus()
    } else {
      ElMessage.error(response.message || '健康检查失败')
    }
  } catch (error) {
    ElMessage.error('健康检查失败')
    console.error('健康检查失败:', error)
  }
}

const batchOperation = async (action) => {
  if (selectedProxies.value.length === 0) {
    ElMessage.warning('请先选择要操作的代理')
    return
  }

  try {
    const names = selectedProxies.value.map(proxy => proxy.name)
    const response = await batchApiProxyOperation(action, names)

    if (response.success) {
      ElMessage.success(response.message)
      loadApiProxies()
      loadApiProxyStatus()
    } else {
      ElMessage.error(response.message || '批量操作失败')
    }
  } catch (error) {
    ElMessage.error('批量操作失败')
    console.error('批量操作失败:', error)
  }
}

const handleSelectionChange = (selection) => {
  selectedProxies.value = selection
}

const handleModelsChange = () => {
  // 如果支持模型列表不为空，且当前默认模型不在支持模型列表中
  if (apiProxyForm.models.length > 0 && !apiProxyForm.models.includes(apiProxyForm.model)) {
    // 将第一个支持模型设为默认模型
    apiProxyForm.model = apiProxyForm.models[0]
  }
}

const importDialogVisible = ref(false)
const alertRulesDialogVisible = ref(false)
const importing = ref(false)
const savingAlertRules = ref(false)
const selectedFile = ref(null)
const testingModels = ref(false)
const maxTestCount = ref(10)
const discoveringModels = ref(false)

// 测试进度相关变量
const testProgressDialogVisible = ref(false)
const currentTestingProxy = ref('')
const testProgressPercentage = ref(0)
const testProgressStatus = ref('')
const testProgressText = ref('')
const modelTestResults = ref([])
const testCompleted = ref(false)
const totalModels = ref(0)
const testedModels = ref(0)
const availableModelsCount = ref(0)
const successRate = ref(0)
const progressPollingInterval = ref(null)



const alertRules = reactive({
  success_rate_threshold: 80,
  response_time_threshold: 5000,
  consecutive_errors_threshold: 5,
  notification_email: '',
  notification_webhook: '',
  alert_enabled: false
})

const handleMoreOperations = (command) => {
  if (command === 'export') {
    exportConfig()
  } else if (command === 'import') {
    importDialogVisible.value = true
  } else if (command === 'alertRules') {
    loadAlertRules()
  }
}


const exportConfig = async () => {
  try {
    const response = await exportApiProxyConfig()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `api_proxy_config_${Date.now()}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('配置导出成功')
  } catch (error) {
    ElMessage.error('配置导出失败')
    console.error('配置导出失败:', error)
  }
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const importConfig = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择配置文件')
    return
  }
  
  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    const response = await importApiProxyConfig(formData)
    if (response.success) {
      ElMessage.success(response.message || '配置导入成功')
      importDialogVisible.value = false
      loadApiProxies()
      loadApiProxyStatus()
    } else {
      ElMessage.error(response.message || '配置导入失败')
    }
  } catch (error) {
    ElMessage.error('配置导入失败')
    console.error('配置导入失败:', error)
  } finally {
    importing.value = false
  }
}

const loadAlertRules = async () => {
  try {
    const response = await getApiProxyAlertRules()
    if (response.success) {
      Object.assign(alertRules, response.data)
      alertRulesDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '加载告警规则失败')
    }
  } catch (error) {
    ElMessage.error('加载告警规则失败')
    console.error('加载告警规则失败:', error)
  }
}

const saveAlertRules = async () => {
  savingAlertRules.value = true
  try {
    const response = await setApiProxyAlertRules(alertRules)
    if (response.success) {
      ElMessage.success('告警规则保存成功')
      alertRulesDialogVisible.value = false
    } else {
      ElMessage.error(response.message || '保存告警规则失败')
    }
  } catch (error) {
    ElMessage.error('保存告警规则失败')
    console.error('保存告警规则失败:', error)
  } finally {
    savingAlertRules.value = false
  }
}

const testModelsAvailability = async (proxy) => {
  if (!proxy) return

  testingModels.value = true
  try {
    const response = await testModelAvailability(proxy.name, {
      max_test_count: maxTestCount.value
    })

    if (response.success) {
      // 更新代理的可用模型列表
      proxy.available_models = response.data.available_models

      const successCount = response.data.results.filter(r => r.success).length
      ElMessage.success(`模型测试完成，可用模型: ${successCount}/${response.data.results.length}`)
    } else {
      ElMessage.error(response.message || '测试模型可用性失败')
    }
  } catch (error) {
    ElMessage.error('测试模型可用性失败')
    console.error('测试模型可用性失败:', error)
  } finally {
    testingModels.value = false
  }
}

// 智能发现模型
const discoverModels = async () => {
  if (!apiProxyForm.api_base || !apiKeysText.value) {
    ElMessage.warning('请先填写API地址和密钥')
    return
  }

  discoveringModels.value = true
  try {
    const response = await discoverModelsFromApi(apiProxyForm.api_base, apiKeysText.value)

    if (response.success) {
      const { available_models, best_model, test_results } = response.data

      // 更新支持的模型列表
      if (available_models && available_models.length > 0) {
        apiProxyForm.models = [...available_models]
        apiProxyForm.available_models = [...available_models]

        // 智能选择最佳模型作为默认模型
        if (best_model) {
          apiProxyForm.model = best_model
        }

        ElMessage.success(`发现 ${available_models.length} 个可用模型，已自动选择最佳模型: ${best_model}`)

        // 显示测试结果详情
        if (test_results && test_results.length > 0) {
          const successCount = test_results.filter(r => r.success).length
          console.log('模型测试详情:', test_results)
          ElMessage.info(`测试了 ${test_results.length} 个模型，其中 ${successCount} 个可用`)
        }
      } else {
        ElMessage.warning('未发现可用模型，请检查API地址和密钥是否正确')
      }
    } else {
      ElMessage.error(response.message || '发现模型失败')
    }
  } catch (error) {
    ElMessage.error('发现模型失败')
    console.error('发现模型失败:', error)
  } finally {
    discoveringModels.value = false
  }
}

// 开始轮询测试进度
const startProgressPolling = (proxyName) => {
  // 清除之前的轮询
  if (progressPollingInterval.value) {
    clearInterval(progressPollingInterval.value)
  }

  // 开始轮询
  progressPollingInterval.value = setInterval(async () => {
    try {
      const response = await getTestProgress(proxyName)
      if (response.success) {
        const progress = response.data

        // 更新进度显示
        updateProgressDisplay(progress)

        // 如果测试完成，停止轮询
        if (progress.completed) {
          clearInterval(progressPollingInterval.value)
          progressPollingInterval.value = null
        }
      }
    } catch (error) {
      console.error('获取测试进度失败:', error)
    }
  }, 1000) // 每秒轮询一次
}

// 停止轮询
const stopProgressPolling = () => {
  if (progressPollingInterval.value) {
    clearInterval(progressPollingInterval.value)
    progressPollingInterval.value = null
  }
}

// 更新进度显示
const updateProgressDisplay = (progress) => {
  const { total_models, tested_models, current_model, results, status } = progress

  // 更新进度条
  if (total_models > 0) {
    testProgressPercentage.value = Math.round((tested_models / total_models) * 100)
  }

  // 更新状态文本
  if (current_model) {
    testProgressText.value = `正在测试模型: ${current_model} (${tested_models}/${total_models})`
  } else if (status === 'completed') {
    testProgressText.value = `测试完成！(${tested_models}/${total_models})`
  } else {
    testProgressText.value = `已测试: ${tested_models}/${total_models}`
  }

  // 更新统计数据
  totalModels.value = total_models
  testedModels.value = tested_models

  // 更新模型测试结果表格
  if (results && results.length > 0) {
    // 创建一个包含所有模型的结果数组
    const allModels = modelTestResults.value.map(item => item.model)
    const updatedResults = allModels.map(model => {
      const result = results.find(r => r.model === model)
      if (result) {
        let status = 'failed'
        if (result.success) {
          status = 'success'
        } else if (result.rate_limited) {
          status = 'rate_limited'
        } else if (result.no_channel) {
          status = 'no_channel'
        }

        return {
          model: result.model,
          status: status,
          status_code: result.status_code,
          response_time: result.response_time,
          message: result.message || (result.success ? '测试成功' : '测试失败')
        }
      } else {
        // 如果是当前正在测试的模型
        if (model === current_model) {
          return {
            model,
            status: 'testing',
            status_code: null,
            response_time: null,
            message: '正在测试...'
          }
        } else {
          // 还未测试的模型
          return {
            model,
            status: 'waiting',
            status_code: null,
            response_time: null,
            message: '等待测试...'
          }
        }
      }
    })

    modelTestResults.value = updatedResults

    // 更新可用模型数量
    availableModelsCount.value = results.filter(r => r.success).length

    // 更新成功率
    if (tested_models > 0) {
      successRate.value = Math.round((availableModelsCount.value / tested_models) * 100)
    }
  }
}

// 获取模型测试状态类型
const getModelTestStatusType = (status) => {
  switch (status) {
    case 'testing': return 'warning'
    case 'success': return 'success'
    case 'rate_limited': return 'primary' // 蓝色，表示限流
    case 'no_channel': return 'warning'   // 橙色，表示无可用渠道
    case 'failed': return 'danger'
    case 'waiting': return 'info'
    default: return 'info'
  }
}

// 获取模型测试状态文本
const getModelTestStatusText = (status) => {
  switch (status) {
    case 'testing': return '测试中'
    case 'success': return '成功'
    case 'rate_limited': return '限流'
    case 'no_channel': return '无渠道'
    case 'failed': return '失败'
    case 'waiting': return '等待中'
    default: return '未知'
  }
}

// 获取响应码样式类
const getStatusCodeClass = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) {
    return 'status-code-success'
  } else if (statusCode === 429) {
    return 'status-code-rate-limit' // 429 请求频繁，单独处理
  } else if (statusCode === 503) {
    return 'status-code-no-channel' // 503 无可用渠道，单独处理
  } else if (statusCode >= 400 && statusCode < 500) {
    return 'status-code-client-error'
  } else if (statusCode >= 500) {
    return 'status-code-server-error'
  } else {
    return 'status-code-other'
  }
}

// 生命周期
onMounted(() => {
  loadApiProxyStatus()
  loadAvailableModels()
  loadApiProxies()
})


</script>

<style scoped>
.api-proxy-management {
  padding: 20px;
}

.status-overview {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.stat-trend.positive {
  color: #67c23a;
}

.stat-trend.negative {
  color: #f56c6c;
}

.toolbar-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.card-header .el-icon {
  margin-right: 8px;
}

.operations-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left .el-button {
  margin-right: 10px;
}

.proxy-list-card {
  margin-bottom: 20px;
}

.header-actions {
  margin-left: auto;
}

.success-rate-text {
  margin-left: 8px;
  font-size: 12px;
  color: #606266;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.discover-models-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.discover-btn {
  min-width: 140px;
}

.discover-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.proxy-detail {
  padding: 20px 0;
}

.model-tag {
  margin: 4px;
}

.priority-setting {
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.available-models-section {
  margin-top: 10px;
  margin-bottom: 20px;
}

.models-list {
  margin-bottom: 10px;
  min-height: 40px;
}

.models-actions {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.no-models-tip {
  color: #909399;
  font-size: 14px;
  padding: 10px 0;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.4;
}

/* 测试进度对话框样式 */
.test-progress-content {
  max-height: 600px;
  overflow-y: auto;
}

.progress-header {
  margin-bottom: 20px;
}

.progress-header h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.progress-text {
  margin-top: 10px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.percentage-value {
  font-weight: bold;
  color: #409eff;
}

.models-test-list {
  margin: 20px 0;
}

.test-summary {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.test-summary .el-statistic {
  text-align: center;
}

.mb-3 {
  margin-bottom: 12px;
}

/* 响应码样式 */
.status-code-success {
  color: #67c23a;
  font-weight: bold;
}

.status-code-rate-limit {
  color: #409eff; /* 蓝色 - 429 请求频繁，不是错误 */
  font-weight: bold;
}

.status-code-no-channel {
  color: #e6a23c; /* 橙色 - 503 无可用渠道，配置问题 */
  font-weight: bold;
}

.status-code-client-error {
  color: #e6a23c;
  font-weight: bold;
}

.status-code-server-error {
  color: #f56c6c;
  font-weight: bold;
}

.status-code-other {
  color: #909399;
  font-weight: bold;
}

.status-code-empty {
  color: #c0c4cc;
}

</style>
