<template>
  <div class="realtime-monitor">
    <!-- 实时状态指示器 -->
    <el-card class="status-card" shadow="hover">
      <div class="status-header">
        <div class="status-indicator" :class="{ 'online': isOnline, 'offline': !isOnline }">
          <div class="indicator-dot"></div>
          <span>{{ isOnline ? '实时监控中' : '连接断开' }}</span>
        </div>
        <div class="last-update">
          最后更新: {{ lastUpdateTime }}
        </div>
      </div>
    </el-card>

    <!-- 实时指标 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(metric, index) in realtimeMetrics" :key="index">
        <el-card class="metric-card" shadow="hover">
          <div class="metric-content">
            <div class="metric-icon" :style="{ backgroundColor: metric.color }">
              <el-icon><component :is="metric.icon" /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value" :class="{ 'animate-pulse': metric.isActive }">
                {{ metric.value }}
              </div>
              <div class="metric-label">{{ metric.label }}</div>
            </div>
          </div>
          <div class="metric-change" :class="metric.changeType">
            <el-icon>
              <ArrowUp v-if="metric.changeType === 'increase'" />
              <ArrowDown v-else-if="metric.changeType === 'decrease'" />
              <Minus v-else />
            </el-icon>
            <span>{{ metric.change }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时图表 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 实时请求量 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>实时请求量</span>
              <div class="chart-controls">
                <el-button-group size="small">
                  <el-button :type="timeRange === '1m' ? 'primary' : ''" @click="setTimeRange('1m')">1分钟</el-button>
                  <el-button :type="timeRange === '5m' ? 'primary' : ''" @click="setTimeRange('5m')">5分钟</el-button>
                  <el-button :type="timeRange === '15m' ? 'primary' : ''" @click="setTimeRange('15m')">15分钟</el-button>
                </el-button-group>
              </div>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="requestChartOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>

      <!-- 响应时间分布 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Timer /></el-icon>
              <span>响应时间分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="responseTimeOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 活动日志 -->
    <el-row :gutter="20" class="activity-row">
      <!-- 实时活动流 -->
      <el-col :xs="24" :lg="16">
        <el-card class="activity-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>实时活动流</span>
              <div class="activity-controls">
                <el-switch
                  v-model="autoScroll"
                  active-text="自动滚动"
                  inactive-text="暂停滚动"
                />
                <el-button size="small" @click="clearActivities" :icon="Delete">清空</el-button>
              </div>
            </div>
          </template>
          <div class="activity-stream" ref="activityStreamRef">
            <div
              v-for="(activity, index) in activities"
              :key="activity.id"
              class="activity-item"
              :class="activity.type"
            >
              <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              <div class="activity-icon">
                <el-icon><component :is="activity.icon" /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-detail">{{ activity.detail }}</div>
              </div>
              <div class="activity-status">
                <el-tag :type="activity.statusType" size="small">{{ activity.status }}</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 系统资源监控 -->
      <el-col :xs="24" :lg="8">
        <el-card class="resource-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>系统资源</span>
            </div>
          </template>
          <div class="resource-monitors">
            <div v-for="resource in systemResources" :key="resource.name" class="resource-item">
              <div class="resource-header">
                <span class="resource-name">{{ resource.name }}</span>
                <span class="resource-value">{{ resource.value }}%</span>
              </div>
              <el-progress
                :percentage="resource.value"
                :status="getResourceStatus(resource.value)"
                :stroke-width="8"
                :show-text="false"
              />
              <div class="resource-detail">
                <span>{{ resource.detail }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 错误监控 -->
    <el-card class="error-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><WarningFilled /></el-icon>
          <span>错误监控</span>
          <div class="error-stats">
            <el-tag type="danger">{{ errorCount }} 个错误</el-tag>
            <el-tag type="warning">{{ warningCount }} 个警告</el-tag>
          </div>
        </div>
      </template>

      <el-table
        :data="recentErrors"
        stripe
        style="width: 100%"
        max-height="300"
      >
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.level === 'error' ? 'danger' : 'warning'" size="small">
              {{ row.level.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="错误信息" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link size="small" @click="viewErrorDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts,
  Timer,
  List,
  Delete,
  Monitor,
  WarningFilled,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  User,
  Setting,
  Warning
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'

// 响应式数据
const isOnline = ref(true)
const lastUpdateTime = ref('')
const timeRange = ref('5m')
const autoScroll = ref(true)
const activityStreamRef = ref()

const realtimeMetrics = ref([
  {
    label: '当前在线用户',
    value: '1,234',
    icon: 'User',
    color: '#409eff',
    change: '+12',
    changeType: 'increase',
    isActive: true
  },
  {
    label: '每秒请求数',
    value: '45.6',
    icon: 'TrendCharts',
    color: '#67c23a',
    change: '+5.2',
    changeType: 'increase',
    isActive: true
  },
  {
    label: '平均响应时间',
    value: '156ms',
    icon: 'Timer',
    color: '#e6a23c',
    change: '-8ms',
    changeType: 'decrease',
    isActive: false
  },
  {
    label: '错误率',
    value: '0.12%',
    icon: 'WarningFilled',
    color: '#f56c6c',
    change: '0',
    changeType: 'stable',
    isActive: false
  }
])

const activities = ref([])
const systemResources = ref([
  {
    name: 'CPU使用率',
    value: 45,
    detail: '4核心 @ 2.4GHz'
  },
  {
    name: '内存使用率',
    value: 68,
    detail: '6.8GB / 10GB'
  },
  {
    name: '磁盘使用率',
    value: 32,
    detail: '320GB / 1TB'
  },
  {
    name: '网络带宽',
    value: 25,
    detail: '25MB/s'
  }
])

const recentErrors = ref([])
const errorCount = ref(0)
const warningCount = ref(0)

// WebSocket连接
let ws = null
let updateTimer = null

// 图表数据
const requestData = ref([])
const responseTimeData = ref([])

// 计算属性
const requestChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: requestData.value.map(item => item.time)
  },
  yAxis: {
    type: 'value',
    name: '请求数/秒'
  },
  series: [
    {
      data: requestData.value.map(item => item.value),
      type: 'line',
      smooth: true,
      itemStyle: { color: '#409eff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ]
        }
      }
    }
  ]
}))

const responseTimeOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  series: [
    {
      name: '响应时间分布',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 35, name: '< 100ms' },
        { value: 45, name: '100-500ms' },
        { value: 15, name: '500ms-1s' },
        { value: 5, name: '> 1s' }
      ],
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
const connectWebSocket = () => {
  // 模拟WebSocket连接
  isOnline.value = true
  console.log('WebSocket连接已建立')
}

const disconnectWebSocket = () => {
  if (ws) {
    ws.close()
    ws = null
  }
  isOnline.value = false
}

const updateLastUpdateTime = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString()
}

const setTimeRange = (range) => {
  timeRange.value = range
  generateRequestData()
}

const generateRequestData = () => {
  const now = new Date()
  const points = timeRange.value === '1m' ? 60 : timeRange.value === '5m' ? 300 : 900
  const interval = timeRange.value === '1m' ? 1000 : timeRange.value === '5m' ? 1000 : 1000

  requestData.value = Array.from({ length: 30 }, (_, index) => {
    const time = new Date(now.getTime() - (29 - index) * interval)
    return {
      time: time.toLocaleTimeString(),
      value: Math.floor(Math.random() * 50) + 20
    }
  })
}

const addActivity = (activity) => {
  activities.value.unshift({
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    ...activity
  })

  // 限制活动数量
  if (activities.value.length > 100) {
    activities.value = activities.value.slice(0, 100)
  }

  // 自动滚动
  if (autoScroll.value) {
    nextTick(() => {
      if (activityStreamRef.value) {
        activityStreamRef.value.scrollTop = 0
      }
    })
  }
}

const clearActivities = () => {
  activities.value = []
}

const getResourceStatus = (value) => {
  if (value >= 80) return 'exception'
  if (value >= 60) return 'warning'
  return 'success'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const viewErrorDetail = (error) => {
  ElMessage.info(`查看错误详情: ${error.message}`)
}

const simulateRealTimeData = () => {
  // 模拟实时数据更新
  updateTimer = setInterval(() => {
    updateLastUpdateTime()

    // 更新指标
    realtimeMetrics.value.forEach(metric => {
      if (metric.isActive) {
        const change = (Math.random() - 0.5) * 10
        metric.change = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)
        metric.changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable'
      }
    })

    // 更新系统资源
    systemResources.value.forEach(resource => {
      const change = (Math.random() - 0.5) * 10
      resource.value = Math.max(0, Math.min(100, resource.value + change))
    })

    // 添加随机活动
    if (Math.random() > 0.7) {
      const activityTypes = [
        {
          type: 'search',
          title: '用户搜索题目',
          detail: '搜索关键词: Vue.js组件',
          icon: 'Search',
          status: '成功',
          statusType: 'success'
        },
        {
          type: 'user',
          title: '新用户注册',
          detail: '用户ID: user_12345',
          icon: 'User',
          status: '完成',
          statusType: 'success'
        },
        {
          type: 'error',
          title: '系统错误',
          detail: 'API请求超时',
          icon: 'Warning',
          status: '错误',
          statusType: 'danger'
        }
      ]

      const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)]
      addActivity(randomActivity)
    }

    // 更新请求数据
    const newPoint = {
      time: new Date().toLocaleTimeString(),
      value: Math.floor(Math.random() * 50) + 20
    }
    requestData.value.push(newPoint)
    if (requestData.value.length > 30) {
      requestData.value.shift()
    }

    // 随机生成错误
    if (Math.random() > 0.9) {
      const error = {
        timestamp: Date.now(),
        level: Math.random() > 0.7 ? 'error' : 'warning',
        message: '数据库连接超时',
        source: 'API服务'
      }
      recentErrors.value.unshift(error)
      if (recentErrors.value.length > 20) {
        recentErrors.value.pop()
      }

      if (error.level === 'error') {
        errorCount.value++
      } else {
        warningCount.value++
      }
    }
  }, 2000)
}

// 生命周期
onMounted(() => {
  connectWebSocket()
  generateRequestData()
  simulateRealTimeData()
  updateLastUpdateTime()
})

onUnmounted(() => {
  disconnectWebSocket()
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style lang="scss" scoped>
.realtime-monitor {
  padding: 20px;
}

.status-card {
  margin-bottom: 20px;

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      .indicator-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      &.online {
        color: #67c23a;

        .indicator-dot {
          background: #67c23a;
        }
      }

      &.offline {
        color: #f56c6c;

        .indicator-dot {
          background: #f56c6c;
          animation: none;
        }
      }
    }

    .last-update {
      font-size: 14px;
      color: #909399;
    }
  }
}

.metrics-row {
  margin-bottom: 20px;

  .metric-card {
    .metric-content {
      display: flex;
      align-items: center;
      margin-bottom: 10px;

      .metric-icon {
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

      .metric-info {
        .metric-value {
          font-size: 24px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;

          &.animate-pulse {
            animation: pulse 2s infinite;
          }
        }

        .metric-label {
          color: #7f8c8d;
          font-size: 14px;
        }
      }
    }

    .metric-change {
      display: flex;
      align-items: center;
      font-size: 12px;

      &.increase {
        color: #67c23a;
      }

      &.decrease {
        color: #f56c6c;
      }

      &.stable {
        color: #909399;
      }

      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

.charts-row,
.activity-row {
  margin-bottom: 20px;

  .chart-card,
  .activity-card,
  .resource-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;

      .chart-controls,
      .activity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }
}

.activity-stream {
  max-height: 400px;
  overflow-y: auto;

  .activity-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .activity-time {
      width: 80px;
      font-size: 12px;
      color: #909399;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 12px;
      color: #909399;
    }

    .activity-content {
      flex: 1;

      .activity-title {
        font-size: 14px;
        margin-bottom: 4px;
      }

      .activity-detail {
        font-size: 12px;
        color: #909399;
      }
    }

    .activity-status {
      margin-left: 12px;
    }

    &.search .activity-icon {
      background: #e6f7ff;
      color: #409eff;
    }

    &.user .activity-icon {
      background: #f6ffed;
      color: #67c23a;
    }

    &.error .activity-icon {
      background: #fff2f0;
      color: #f56c6c;
    }
  }
}

.resource-monitors {
  .resource-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .resource-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .resource-name {
        font-size: 14px;
        color: #606266;
      }

      .resource-value {
        font-weight: 600;
        color: #2c3e50;
      }
    }

    .resource-detail {
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
    }
  }
}

.error-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    .error-stats {
      display: flex;
      gap: 8px;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .realtime-monitor {
    padding: 10px;
  }

  .status-header {
    flex-direction: column !important;
    gap: 8px;
  }

  .card-header {
    flex-direction: column !important;
    gap: 12px;

    .chart-controls,
    .activity-controls,
    .error-stats {
      width: 100%;
      justify-content: center;
    }
  }

  .activity-item {
    flex-direction: column !important;
    text-align: center;
    gap: 8px;
  }
}
</style>
