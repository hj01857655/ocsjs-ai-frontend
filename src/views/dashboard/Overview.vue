<template>
  <div class="dashboard-overview">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(stat, index) in statsData" :key="index">
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

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <!-- 搜索趋势图 -->
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>搜索趋势</span>
              <el-radio-group v-model="trendPeriod" size="small" @change="updateTrendChart">
                <el-radio-button value="7d">7天</el-radio-button>
                <el-radio-button value="30d">30天</el-radio-button>
                <el-radio-button value="90d">90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              v-if="chartReady"
              :option="trendChartOption"
              style="height: 300px;"
              :autoresize="true"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 题型分布 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span>题型分布</span>
          </template>
          <div class="chart-container">
            <v-chart
              v-if="chartReady"
              :option="pieChartOption"
              style="height: 300px;"
              :autoresize="true"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统状态 -->
    <el-row :gutter="20" class="system-section">
      <!-- 系统状态 -->
      <el-col :xs="24" :lg="12">
        <el-card class="system-card" shadow="hover">
          <template #header>
            <span>系统状态</span>
            <el-button link @click="refreshSystemStatus" :loading="systemLoading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </template>
          <div class="system-status">
            <div class="status-item" v-for="item in systemStatus" :key="item.name">
              <div class="status-info">
                <span class="status-name">{{ item.name }}</span>
                <el-tag :type="item.status === 'healthy' ? 'success' : 'danger'" size="small">
                  {{ item.status === 'healthy' ? '正常' : '异常' }}
                </el-tag>
              </div>
              <div class="status-detail">{{ item.detail }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最近活动 -->
      <el-col :xs="24" :lg="12">
        <el-card class="activity-card" shadow="hover">
          <template #header>
            <span>最近活动</span>
          </template>
          <div class="activity-list">
            <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
              <div class="activity-icon">
                <el-icon><component :is="activity.icon" /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ formatTime(activity.time) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="24">
        <el-card class="actions-card" shadow="hover">
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="actions-grid">
            <div
              class="action-item"
              v-for="action in quickActions"
              :key="action.name"
              @click="handleQuickAction(action)"
            >
              <div class="action-icon" :style="{ backgroundColor: action.color }">
                <el-icon><component :is="action.icon" /></el-icon>
              </div>
              <div class="action-label">{{ action.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  Document,
  User,
  Clock,
  TrendCharts,
  Bottom,
  Refresh,
  Search,
  Upload,
  Setting,
  Download,
  View,
  Edit
} from '@element-plus/icons-vue'
import { getDashboardData } from '@/api/questions'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()

// 响应式数据
const trendPeriod = ref('7d')
const systemLoading = ref(false)
const chartReady = ref(false)
const dataLoading = ref(false)

const statsData = ref([
  {
    label: '总题目数',
    value: '0',
    icon: 'Document',
    color: '#409eff',
    trend: 0
  },
  {
    label: '今日搜索',
    value: '0',
    icon: 'Search',
    color: '#67c23a',
    trend: 0
  },
  {
    label: '活跃用户',
    value: '0',
    icon: 'User',
    color: '#e6a23c',
    trend: 0
  },
  {
    label: '缓存命中率',
    value: '0%',
    icon: 'DataAnalysis',
    color: '#f56c6c',
    trend: 0
  }
])

const systemStatus = ref([])
const recentActivities = ref([])
const trendData = ref([])
const typeDistribution = ref([])

const quickActions = ref([
  {
    name: 'search',
    label: 'AI搜题',
    icon: 'Search',
    color: '#409eff',
    path: '/search/ai'
  },
  {
    name: 'import',
    label: '导入题目',
    icon: 'Upload',
    color: '#67c23a',
    path: '/questions/import'
  },
  {
    name: 'export',
    label: '导出数据',
    icon: 'Download',
    color: '#e6a23c',
    action: 'export'
  },
  {
    name: 'settings',
    label: '系统设置',
    icon: 'Setting',
    color: '#f56c6c',
    path: '/system/cache'
  },
  {
    name: 'view',
    label: '题库管理',
    icon: 'View',
    color: '#909399',
    path: '/questions/list'
  },
  {
    name: 'stats',
    label: '统计分析',
    icon: 'DataAnalysis',
    color: '#606266',
    path: '/questions/statistics'
  }
])

// 图表配置
const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['搜索次数', '成功率']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: [
    {
      type: 'value',
      name: '搜索次数'
    },
    {
      type: 'value',
      name: '成功率(%)',
      min: 0,
      max: 100
    }
  ],
  series: [
    {
      name: '搜索次数',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230, 210],
      smooth: true
    },
    {
      name: '成功率',
      type: 'line',
      yAxisIndex: 1,
      data: [85, 88, 92, 89, 94, 91, 95],
      smooth: true
    }
  ]
}))

const pieChartOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '题型分布',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: '单选题' },
        { value: 735, name: '多选题' },
        { value: 580, name: '判断题' },
        { value: 484, name: '填空题' }
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
const updateTrendChart = () => {
  // 根据时间段更新图表数据
  console.log('更新趋势图:', trendPeriod.value)
}

const refreshSystemStatus = async () => {
  systemLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('系统状态已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    systemLoading.value = false
  }
}

const handleQuickAction = (action) => {
  if (action.path) {
    router.push(action.path)
  } else if (action.action === 'export') {
    ElMessage.info('导出功能开发中...')
  }
}

const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}

// 生命周期
onMounted(() => {
  // 使用 nextTick 确保 DOM 已经渲染完成
  nextTick(() => {
    chartReady.value = true
  })
})
</script>

<style lang="scss" scoped>
.dashboard-overview {
  padding: 20px;
}

.stats-cards {
  margin-bottom: 20px;

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      margin-bottom: 10px;

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

    .stat-trend {
      display: flex;
      align-items: center;
      font-size: 12px;

      &.positive {
        color: #67c23a;
      }

      &.negative {
        color: #f56c6c;
      }

      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

.charts-section {
  margin-bottom: 20px;

  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-container {
      width: 100%;
    }
  }
}

.system-section {
  margin-bottom: 20px;

  .system-card {
    .system-status {
      .status-item {
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .status-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;

          .status-name {
            font-weight: 500;
          }
        }

        .status-detail {
          color: #7f8c8d;
          font-size: 12px;
        }
      }
    }
  }

  .activity-card {
    .activity-list {
      .activity-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f5f7fa;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          color: #909399;
        }

        .activity-content {
          flex: 1;

          .activity-title {
            font-size: 14px;
            margin-bottom: 4px;
          }

          .activity-time {
            font-size: 12px;
            color: #7f8c8d;
          }
        }
      }
    }
  }
}

.quick-actions {
  .actions-card {
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 20px;

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f5f7fa;
          transform: translateY(-2px);
        }

        .action-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .action-label {
          font-size: 14px;
          color: #2c3e50;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-overview {
    padding: 10px;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
