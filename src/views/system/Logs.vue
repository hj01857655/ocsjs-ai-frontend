<template>
  <div class="system-logs">
    <!-- 日志统计概览 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(stat, index) in logStats" :key="index">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 日志筛选 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Filter /></el-icon>
          <span>日志筛选</span>
        </div>
      </template>
      
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="日志级别">
          <el-select v-model="filterForm.level" placeholder="选择级别" clearable style="width: 120px">
            <el-option label="DEBUG" value="debug" />
            <el-option label="INFO" value="info" />
            <el-option label="WARN" value="warn" />
            <el-option label="ERROR" value="error" />
            <el-option label="FATAL" value="fatal" />
          </el-select>
        </el-form-item>
        <el-form-item label="日志来源">
          <el-select v-model="filterForm.source" placeholder="选择来源" clearable style="width: 150px">
            <el-option label="API服务" value="api" />
            <el-option label="数据库" value="database" />
            <el-option label="缓存" value="cache" />
            <el-option label="代理池" value="proxy" />
            <el-option label="搜索引擎" value="search" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 350px"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索日志内容..."
            style="width: 200px"
            @keyup.enter="searchLogs"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchLogs" :icon="Search">搜索</el-button>
          <el-button @click="resetFilter" :icon="RefreshRight">重置</el-button>
          <el-button type="success" @click="exportLogs" :icon="Download">导出</el-button>
        </el-form-item>

        <!-- 快捷过滤按钮 -->
        <el-form-item label="快捷过滤">
          <el-button-group>
            <el-button
              size="small"
              :type="filterForm.level === 'error' ? 'danger' : 'default'"
              @click="quickFilter('error')"
            >
              错误
            </el-button>
            <el-button
              size="small"
              :type="filterForm.level === 'warn' ? 'warning' : 'default'"
              @click="quickFilter('warn')"
            >
              警告
            </el-button>
            <el-button
              size="small"
              :type="filterForm.level === 'info' ? 'primary' : 'default'"
              @click="quickFilter('info')"
            >
              信息
            </el-button>
            <el-button
              size="small"
              :type="filterForm.level === '' ? 'success' : 'default'"
              @click="quickFilter('')"
            >
              全部
            </el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 实时日志开关 -->
    <el-card class="realtime-card" shadow="hover">
      <div class="realtime-controls">
        <div class="realtime-status">
          <el-switch
            v-model="realtimeEnabled"
            active-text="实时日志"
            inactive-text="暂停更新"
            @change="toggleRealtime"
          />
          <span class="status-indicator" :class="{ 'active': realtimeEnabled }">
            <div class="indicator-dot"></div>
            {{ realtimeEnabled ? '实时更新中' : '已暂停' }}
          </span>
        </div>
        <div class="realtime-actions">
          <el-button size="small" @click="clearLogs" :icon="Delete">清空日志</el-button>
          <el-button size="small" @click="refreshLogs" :icon="Refresh">刷新</el-button>
        </div>
      </div>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="logs-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>系统日志</span>
          <div class="header-info">
            <span>共 {{ pagination.total }} 条日志</span>
          </div>
        </div>
      </template>

      <div class="logs-container" ref="logsContainerRef">
        <el-table
          v-loading="tableLoading"
          :data="logsList"
          stripe
          border
          style="width: 100%"
          :row-class-name="getRowClassName"
          @row-click="viewLogDetail"
          lazy
          :scroll-y="{ gt: 20 }"
          :cell-style="{ padding: '8px 0' }"
        >
          <el-table-column prop="timestamp" label="时间" width="180" fixed="left">
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="级别" width="80">
            <template #default="{ row }">
              <el-tag :type="getLevelTagType(row.level)" size="small">
                {{ row.level.toUpperCase() }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="来源" width="120">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ getSourceName(row.source) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="日志内容" min-width="400" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="log-message" :class="`level-${row.level}`">
                {{ row.message }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="user_id" label="用户ID" width="100" />
          <el-table-column prop="ip" label="IP地址" width="140" />
          <el-table-column prop="request_id" label="请求ID" width="120" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link size="small" @click="viewLogDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :page-sizes="[20, 50, 100, 200]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadLogs"
            @current-change="loadLogs"
          />
        </div>
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="800px">
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">{{ formatTime(currentLog.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLevelTagType(currentLog.level)">{{ currentLog.level.toUpperCase() }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">{{ getSourceName(currentLog.source) }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentLog.user_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="请求ID">{{ currentLog.request_id || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="log-content">
          <h4>日志内容</h4>
          <el-input
            v-model="currentLog.message"
            type="textarea"
            :rows="6"
            readonly
            style="font-family: monospace;"
          />
        </div>
        
        <div v-if="currentLog.stack_trace" class="stack-trace">
          <h4>堆栈跟踪</h4>
          <el-input
            v-model="currentLog.stack_trace"
            type="textarea"
            :rows="10"
            readonly
            style="font-family: monospace;"
          />
        </div>
        
        <div v-if="currentLog.context" class="log-context">
          <h4>上下文信息</h4>
          <pre class="context-content">{{ JSON.stringify(currentLog.context, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>

    <!-- 日志级别分布图表 -->
    <el-card class="chart-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><PieChart /></el-icon>
          <span>日志级别分布</span>
          <el-radio-group v-model="chartPeriod" size="small" @change="updateChart">
            <el-radio-button value="1h">1小时</el-radio-button>
            <el-radio-button value="24h">24小时</el-radio-button>
            <el-radio-button value="7d">7天</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div class="chart-container">
        <v-chart :option="levelDistributionOption" style="height: 300px;" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Filter,
  Search,
  RefreshRight,
  Download,
  Delete,
  Refresh,
  Document,
  PieChart,
  List,
  Warning,
  InfoFilled,
  CircleCheck
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import {
  getLogsList,
  getLogsStatistics,
  clearLogs as clearLogsApi,
  exportLogs as exportLogsApi,
  getLogLevels,
  getLogSources
} from '@/api/logs'

// 响应式数据
const tableLoading = ref(false)
const realtimeEnabled = ref(true) // 默认开启实时日志
const detailVisible = ref(false)
const currentLog = ref(null)
const logsContainerRef = ref()
const chartPeriod = ref('24h')

const filterForm = reactive({
  level: '',
  source: '',
  timeRange: [],
  keyword: ''
})

const pagination = reactive({
  page: 1,
  size: 20, // 减少默认页面大小，提高性能
  total: 0
})

const logStats = ref([
  {
    label: '今日日志',
    value: '12,345',
    icon: 'Document',
    color: '#409eff'
  },
  {
    label: '错误日志',
    value: '23',
    icon: 'Warning',
    color: '#f56c6c'
  },
  {
    label: '警告日志',
    value: '156',
    icon: 'WarningFilled',
    color: '#e6a23c'
  },
  {
    label: '信息日志',
    value: '11,234',
    icon: 'InfoFilled',
    color: '#67c23a'
  }
])

const logsList = ref([])
const statisticsData = ref({
  overview: {
    today_logs: 0,
    total_logs: 0
  },
  level_distribution: [],
  source_distribution: [],
  daily_trend: []
})

// 实时更新定时器
let realtimeTimer = null

// 图表配置
const levelDistributionOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '日志级别',
      type: 'pie',
      radius: '50%',
      data: statisticsData.value.level_distribution.length > 0
        ? statisticsData.value.level_distribution.map(item => ({
            value: item.count,
            name: item.level.toUpperCase()
          }))
        : [{ value: 0, name: '暂无数据' }],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}))

const sourceDistributionOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '日志来源',
      type: 'pie',
      radius: '50%',
      data: statisticsData.value.source_distribution.length > 0
        ? statisticsData.value.source_distribution.map(item => ({
            value: item.count,
            name: getSourceName(item.source)
          }))
        : [{ value: 0, name: '暂无数据' }],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}))

// 方法
const loadLogs = async () => {
  tableLoading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.page,
      size: pagination.size,
      level: filterForm.level,
      source: filterForm.source,
      keyword: filterForm.keyword
    }

    // 添加时间范围参数
    if (filterForm.timeRange && filterForm.timeRange.length === 2) {
      params.start_time = filterForm.timeRange[0]
      params.end_time = filterForm.timeRange[1]
    }

    // 调用真实API
    const response = await getLogsList(params)

    if (response.success) {
      logsList.value = response.data.logs.map(log => ({
        ...log,
        timestamp: log.created_at,
        ip: log.ip_address
      }))
      pagination.total = response.data.pagination.total
    } else {
      ElMessage.error(response.message || '获取日志列表失败')
    }
  } catch (error) {
    console.error('加载日志失败:', error)
    ElMessage.error('加载日志失败')
  } finally {
    tableLoading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const response = await getLogsStatistics()

    if (response.success) {
      const data = response.data

      // 保存统计数据
      statisticsData.value = data

      // 更新统计卡片
      logStats.value = [
        {
          label: '今日日志',
          value: data.overview.today_logs.toLocaleString(),
          icon: 'Document',
          color: '#409eff'
        },
        {
          label: '总日志数',
          value: data.overview.total_logs.toLocaleString(),
          icon: 'List',
          color: '#67c23a'
        },
        {
          label: '错误日志',
          value: (data.level_distribution.find(item => item.level === 'error')?.count || 0).toLocaleString(),
          icon: 'Warning',
          color: '#f56c6c'
        },
        {
          label: '警告日志',
          value: (data.level_distribution.find(item => item.level === 'warn')?.count || 0).toLocaleString(),
          icon: 'WarningFilled',
          color: '#e6a23c'
        }
      ]
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const searchLogs = () => {
  pagination.page = 1
  loadLogs()
}

const resetFilter = () => {
  Object.assign(filterForm, {
    level: '',
    source: '',
    timeRange: [],
    keyword: ''
  })
  searchLogs()
}

// 快捷过滤方法
const quickFilter = (level) => {
  filterForm.level = level
  pagination.page = 1
  loadLogs()
}



const exportLogs = async () => {
  try {
    ElMessage.info('正在导出日志，请稍候...')

    // 构建导出参数
    const params = {
      level: filterForm.level,
      source: filterForm.source
    }

    // 添加时间范围参数
    if (filterForm.timeRange && filterForm.timeRange.length === 2) {
      params.start_time = filterForm.timeRange[0]
      params.end_time = filterForm.timeRange[1]
    }

    const response = await exportLogsApi(params)

    if (response.success) {
      // 创建下载链接
      const blob = new Blob([JSON.stringify(response.data.logs, null, 2)], {
        type: 'application/json'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `system_logs_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success(`成功导出 ${response.data.count} 条日志`)
    } else {
      ElMessage.error(response.message || '导出日志失败')
    }
  } catch (error) {
    console.error('导出日志失败:', error)
    ElMessage.error('导出日志失败')
  }
}

const toggleRealtime = () => {
  if (realtimeEnabled.value) {
    startRealtimeUpdate()
  } else {
    stopRealtimeUpdate()
  }
}

const startRealtimeUpdate = () => {
  let isUpdating = false

  const updateLogs = async () => {
    // 防止重复执行
    if (isUpdating || !realtimeEnabled.value) return
    isUpdating = true

    try {
      // 只在第一页时进行实时更新，减少不必要的请求
      if (pagination.page !== 1) {
        return
      }

      // 重新加载最新的日志数据，限制数据量
      const params = {
        page: 1,
        size: Math.min(pagination.size, 50), // 限制最大50条，减少数据传输
        level: filterForm.level,
        source: filterForm.source,
        keyword: filterForm.keyword
      }

      // 添加时间范围参数
      if (filterForm.timeRange && filterForm.timeRange.length === 2) {
        params.start_time = filterForm.timeRange[0]
        params.end_time = filterForm.timeRange[1]
      }

      const response = await getLogsList(params)

      if (response.success && response.data.logs.length > 0) {
        const newLogs = response.data.logs.map(log => ({
          ...log,
          timestamp: log.created_at,
          ip: log.ip_address
        }))

        // 检查是否有新日志，避免不必要的DOM更新
        if (logsList.value.length === 0 || newLogs[0].id !== logsList.value[0].id) {
          // 使用requestAnimationFrame优化DOM更新
          requestAnimationFrame(() => {
            logsList.value = newLogs
            pagination.total = response.data.pagination.total
          })

          // 延迟滚动操作，避免强制重排
          setTimeout(() => {
            if (logsContainerRef.value) {
              const table = logsContainerRef.value.querySelector('.el-table__body-wrapper')
              if (table) {
                table.scrollTop = 0
              }
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('实时更新日志失败:', error)
    } finally {
      isUpdating = false
      // 使用setTimeout而不是setInterval，避免重叠执行
      if (realtimeEnabled.value) {
        realtimeTimer = setTimeout(updateLogs, 8000) // 增加到8秒间隔，减少频率
      }
    }
  }

  // 首次执行
  updateLogs()
}

const stopRealtimeUpdate = () => {
  if (realtimeTimer) {
    clearTimeout(realtimeTimer)
    realtimeTimer = null
  }
}

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？此操作不可恢复！', '警告', {
      type: 'warning'
    })

    const response = await clearLogsApi()

    if (response.success) {
      ElMessage.success(response.message || '日志已清空')
      // 重新加载数据
      await loadLogs()
      await loadStatistics()
    } else {
      ElMessage.error(response.message || '清空日志失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空日志失败:', error)
      ElMessage.error('清空日志失败')
    }
  }
}

const refreshLogs = () => {
  loadLogs()
}

const viewLogDetail = (log) => {
  currentLog.value = log
  detailVisible.value = true
}

const getRowClassName = ({ row }) => {
  return `log-row-${row.level}`
}

const getLevelTagType = (level) => {
  const levelMap = {
    debug: 'info',
    info: 'success',
    warn: 'warning',
    error: 'danger',
    fatal: 'danger'
  }
  return levelMap[level] || 'info'
}

const getSourceName = (source) => {
  const sourceMap = {
    api: 'API服务',
    database: '数据库',
    cache: '缓存',
    proxy: '代理池',
    search: '搜索引擎',
    auth: '认证',
    system: '系统'
  }
  return sourceMap[source] || source
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const updateChart = () => {
  console.log('更新图表:', chartPeriod.value)
}

// 生命周期
onMounted(() => {
  loadLogs()
  loadStatistics()

  // 如果实时日志已开启，自动启动实时更新
  if (realtimeEnabled.value) {
    startRealtimeUpdate()
  }

  // 测试前端日志收集
  console.info('日志页面已加载')
  console.log('开始加载日志数据')
})

onUnmounted(() => {
  stopRealtimeUpdate()
})
</script>

<style lang="scss" scoped>
.system-logs {
  padding: 20px;
}

.stats-overview {
  margin-bottom: 20px;
  
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      
      .stat-icon {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        margin-right: 15px;
      }
      
      .stat-info {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .stat-label {
          color: #7f8c8d;
          font-size: 14px;
        }
      }
    }
  }
}

.filter-card,
.realtime-card,
.logs-card,
.chart-card {
  margin-bottom: 20px;
}

.filter-form {
  .el-form-item {
    margin-bottom: 0;
  }
}

.realtime-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .realtime-status {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #909399;
      
      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #909399;
      }
      
      &.active {
        color: #67c23a;
        
        .indicator-dot {
          background: #67c23a;
          animation: pulse 2s infinite;
        }
      }
    }
  }
  
  .realtime-actions {
    display: flex;
    gap: 8px;
  }
}

.logs-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-info {
      font-size: 14px;
      color: #909399;
    }
  }
  
  .logs-container {
    .log-message {
      line-height: 1.4;
      
      &.level-error,
      &.level-fatal {
        color: #f56c6c;
        font-weight: 500;
      }
      
      &.level-warn {
        color: #e6a23c;
      }
      
      &.level-info {
        color: #409eff;
      }
      
      &.level-debug {
        color: #909399;
      }
    }
    
    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }
  }
}

// 表格行样式
:deep(.log-row-error),
:deep(.log-row-fatal) {
  background-color: #fef0f0 !important;
}

:deep(.log-row-warn) {
  background-color: #fdf6ec !important;
}

:deep(.log-row-debug) {
  background-color: #f5f7fa !important;
}

.log-detail {
  .log-content,
  .stack-trace,
  .log-context {
    margin-top: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      font-weight: 500;
    }
    
    .context-content {
      background: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.4;
      overflow-x: auto;
    }
  }
}

.chart-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .system-logs {
    padding: 10px;
  }
  
  .filter-form {
    .el-form-item {
      display: block;
      margin-bottom: 12px;
    }
  }
  
  .realtime-controls {
    flex-direction: column !important;
    gap: 12px;
  }
  
  .card-header {
    flex-direction: column !important;
    gap: 12px;
  }
}
</style>
