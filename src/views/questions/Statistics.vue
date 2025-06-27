<template>
  <div class="questions-statistics">
    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(stat, index) in overviewStats" :key="index">
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
      <!-- 题型分布饼图 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><PieChart /></el-icon>
              <span>题型分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="typeDistributionOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>

      <!-- 难度分布柱状图 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Histogram /></el-icon>
              <span>难度分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="difficultyDistributionOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>

      <!-- 题目增长趋势 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>增长趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="growthTrendOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计 -->
    <el-row :gutter="20" class="detailed-stats">
      <!-- 热门题目排行 -->
      <el-col :xs="24" :lg="12">
        <el-card class="ranking-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Trophy /></el-icon>
              <span>热门题目排行</span>
              <el-radio-group v-model="rankingType" size="small">
                <el-radio-button value="views">浏览量</el-radio-button>
                <el-radio-button value="searches">搜索次数</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="ranking-list">
            <div
              v-for="(item, index) in hotQuestions"
              :key="index"
              class="ranking-item"
            >
              <div class="ranking-number" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </div>
              <div class="ranking-content">
                <div class="question-title">{{ item.question }}</div>
                <div class="question-meta">
                  <el-tag :type="getTypeTagType(item.type)" size="small">{{ getTypeName(item.type) }}</el-tag>
                  <span class="question-count">{{ item.count }} 次</span>
                </div>
              </div>
              <div class="ranking-score">
                <div class="score-value">{{ item.score }}</div>
                <div class="score-label">热度</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 标签云 -->
      <el-col :xs="24" :lg="12">
        <el-card class="tags-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><CollectionTag /></el-icon>
              <span>热门标签</span>
            </div>
          </template>
          <div class="tags-cloud">
            <el-tag
              v-for="tag in popularTags"
              :key="tag.name"
              :size="getTagSize(tag.weight)"
              :type="getTagType(tag.weight)"
              class="tag-item"
              @click="searchByTag(tag.name)"
            >
              {{ tag.name }} ({{ tag.count }})
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><DataBoard /></el-icon>
          <span>详细数据</span>
          <div class="header-actions">
            <el-button type="primary" @click="exportData" :icon="Download">导出数据</el-button>
            <el-button @click="refreshData" :icon="Refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="tableLoading"
        :data="statisticsData"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="total_count" label="总数量" width="100" />
        <el-table-column prop="today_added" label="今日新增" width="100" />
        <el-table-column prop="week_added" label="本周新增" width="100" />
        <el-table-column prop="month_added" label="本月新增" width="100" />
        <el-table-column prop="avg_views" label="平均浏览量" width="120" />
        <el-table-column prop="top_viewed" label="最高浏览量" width="120" />
        <el-table-column prop="last_updated" label="最后更新" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetails(row)">详情</el-button>
            <el-button type="success" size="small" @click="analyzeCategory(row)">分析</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 时间范围选择器 -->
    <el-card class="time-range-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Calendar /></el-icon>
          <span>时间范围分析</span>
        </div>
      </template>

      <div class="time-range-section">
        <el-form :inline="true">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="updateTimeRange"
            />
          </el-form-item>
          <el-form-item label="统计维度">
            <el-select v-model="timeDimension" @change="updateTimeDimension">
              <el-option label="按天" value="day" />
              <el-option label="按周" value="week" />
              <el-option label="按月" value="month" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="generateReport">生成报告</el-button>
          </el-form-item>
        </el-form>

        <div v-if="timeRangeData.length > 0" class="time-range-chart">
          <v-chart :option="timeRangeChartOption" style="height: 400px;" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getQuestionStatistics } from '@/api/questions'
import {
  PieChart,
  Histogram,
  TrendCharts,
  Trophy,
  CollectionTag,
  DataBoard,
  Download,
  Refresh,
  Calendar,
  Bottom,
  Document,
  User,
  View,
  Star,
  Plus
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'

// 响应式数据
const rankingType = ref('views')
const tableLoading = ref(false)
const timeRange = ref([])
const timeDimension = ref('day')
const timeRangeData = ref([])

const overviewStats = ref([
  {
    label: '总题目数',
    value: '12,345',
    icon: 'Document',
    color: '#409eff',
    trend: 12.5
  },
  {
    label: '今日新增',
    value: '156',
    icon: 'Plus',
    color: '#67c23a',
    trend: 8.2
  },
  {
    label: '总浏览量',
    value: '98,765',
    icon: 'View',
    color: '#e6a23c',
    trend: 15.3
  },
  {
    label: '收藏数量',
    value: '2,345',
    icon: 'Star',
    color: '#f56c6c',
    trend: -2.1
  }
])

const hotQuestions = ref([
  {
    question: '以下哪个是Vue.js的核心特性？',
    type: 'single',
    count: 1250,
    score: 95
  },
  {
    question: 'JavaScript中的闭包是什么？',
    type: 'completion',
    count: 980,
    score: 88
  },
  {
    question: 'CSS Flexbox布局的主要特点',
    type: 'multiple',
    count: 756,
    score: 82
  },
  {
    question: 'HTTP和HTTPS的区别',
    type: 'judgement',
    count: 654,
    score: 78
  },
  {
    question: '数据库索引的作用和原理',
    type: 'completion',
    count: 543,
    score: 75
  }
])

const popularTags = ref([
  { name: 'Vue.js', count: 1250, weight: 10 },
  { name: 'JavaScript', count: 980, weight: 8 },
  { name: 'CSS', count: 756, weight: 6 },
  { name: 'HTML', count: 654, weight: 5 },
  { name: 'React', count: 543, weight: 4 },
  { name: 'Node.js', count: 432, weight: 3 },
  { name: 'TypeScript', count: 321, weight: 2 },
  { name: 'Webpack', count: 210, weight: 1 }
])

const statisticsData = ref([
  {
    category: '单选题',
    total_count: 4567,
    today_added: 23,
    week_added: 156,
    month_added: 678,
    avg_views: 45.6,
    top_viewed: 1250,
    last_updated: '2024-01-15 14:30:00'
  },
  {
    category: '多选题',
    total_count: 3456,
    today_added: 18,
    week_added: 124,
    month_added: 543,
    avg_views: 38.2,
    top_viewed: 980,
    last_updated: '2024-01-15 13:45:00'
  },
  {
    category: '判断题',
    total_count: 2345,
    today_added: 12,
    week_added: 89,
    month_added: 367,
    avg_views: 32.1,
    top_viewed: 756,
    last_updated: '2024-01-15 12:20:00'
  },
  {
    category: '填空题',
    total_count: 1977,
    today_added: 15,
    week_added: 98,
    month_added: 412,
    avg_views: 28.9,
    top_viewed: 654,
    last_updated: '2024-01-15 11:15:00'
  }
])

// 图表配置
const typeDistributionOption = computed(() => ({
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
        { value: 4567, name: '单选题' },
        { value: 3456, name: '多选题' },
        { value: 2345, name: '判断题' },
        { value: 1977, name: '填空题' }
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

const difficultyDistributionOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['简单', '中等', '困难']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [5432, 4567, 2346],
      type: 'bar',
      itemStyle: {
        color: function(params) {
          const colors = ['#67c23a', '#e6a23c', '#f56c6c']
          return colors[params.dataIndex]
        }
      }
    }
  ]
}))

const growthTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [1200, 1350, 1100, 1400, 1250, 1600],
      type: 'line',
      smooth: true,
      itemStyle: { color: '#409eff' }
    }
  ]
}))

const timeRangeChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['新增题目', '浏览量']
  },
  xAxis: {
    type: 'category',
    data: timeRangeData.value.map(item => item.date)
  },
  yAxis: [
    {
      type: 'value',
      name: '新增题目'
    },
    {
      type: 'value',
      name: '浏览量'
    }
  ],
  series: [
    {
      name: '新增题目',
      type: 'bar',
      data: timeRangeData.value.map(item => item.added)
    },
    {
      name: '浏览量',
      type: 'line',
      yAxisIndex: 1,
      data: timeRangeData.value.map(item => item.views)
    }
  ]
}))

// 方法
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

const getTagSize = (weight) => {
  if (weight >= 8) return 'large'
  if (weight >= 5) return 'default'
  return 'small'
}

const getTagType = (weight) => {
  if (weight >= 8) return 'danger'
  if (weight >= 5) return 'warning'
  return 'info'
}

const searchByTag = (tagName) => {
  ElMessage.info(`搜索标签: ${tagName}`)
}

const exportData = () => {
  ElMessage.success('数据导出中...')
}

const refreshData = async () => {
  tableLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据已刷新')
  } finally {
    tableLoading.value = false
  }
}

const viewDetails = (row) => {
  ElMessage.info(`查看 ${row.category} 详情`)
}

const analyzeCategory = (row) => {
  ElMessage.info(`分析 ${row.category} 数据`)
}

const updateTimeRange = () => {
  if (timeRange.value && timeRange.value.length === 2) {
    generateReport()
  }
}

const updateTimeDimension = () => {
  if (timeRange.value && timeRange.value.length === 2) {
    generateReport()
  }
}

const generateReport = () => {
  // 模拟生成时间范围数据
  timeRangeData.value = Array.from({ length: 7 }, (_, index) => ({
    date: `2024-01-${index + 1}`,
    added: Math.floor(Math.random() * 50) + 10,
    views: Math.floor(Math.random() * 500) + 100
  }))

  ElMessage.success('报告生成完成')
}

// 数据加载
const loadStatistics = async () => {
  try {
    const response = await getQuestionStatistics()
    if (response.success) {
      const data = response.data

      // 更新概览统计
      overviewStats.value[0].value = data.overview.total_questions
      overviewStats.value[1].value = data.overview.favorite_questions
      overviewStats.value[2].value = data.overview.recent_questions
      overviewStats.value[3].value = data.overview.favorite_rate + '%'

      // 更新图表数据
      updateChartData(data)

    } else {
      ElMessage.error(response.message || '加载统计数据失败')
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

const updateChartData = (data) => {
  // 更新题型分布数据
  if (data.type_distribution) {
    typeDistributionData.value = data.type_distribution.map(item => ({
      name: getTypeName(item.type),
      value: item.count
    }))
  }

  // 更新难度分布数据
  if (data.difficulty_distribution) {
    difficultyDistributionData.value = data.difficulty_distribution.map(item => ({
      name: getDifficultyName(item.difficulty),
      value: item.count
    }))
  }

  // 更新来源分布数据
  if (data.source_distribution) {
    sourceDistributionData.value = data.source_distribution.map(item => ({
      name: item.source,
      value: item.count
    }))
  }
}

const getTypeName = (type) => {
  const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'judgement': '判断题',
    'completion': '填空题',
    'essay': '问答题'
  }
  return typeMap[type] || type
}

const getDifficultyName = (difficulty) => {
  const difficultyMap = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return difficultyMap[difficulty] || difficulty
}

// 生命周期
onMounted(() => {
  loadStatistics()
})
</script>

<style lang="scss" scoped>
.questions-statistics {
  padding: 20px;
}

.stats-overview {
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

.charts-section,
.detailed-stats {
  margin-bottom: 20px;

  .chart-card,
  .ranking-card,
  .tags-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
  }
}

.ranking-list {
  .ranking-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .ranking-number {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      margin-right: 12px;

      &.rank-1 {
        background: #f56c6c;
      }

      &.rank-2 {
        background: #e6a23c;
      }

      &.rank-3 {
        background: #67c23a;
      }

      &:not(.rank-1):not(.rank-2):not(.rank-3) {
        background: #909399;
      }
    }

    .ranking-content {
      flex: 1;

      .question-title {
        font-size: 14px;
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .question-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .question-count {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .ranking-score {
      text-align: center;

      .score-value {
        font-size: 18px;
        font-weight: 600;
        color: #409eff;
      }

      .score-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.tags-cloud {
  .tag-item {
    margin: 4px;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.table-card,
.time-range-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.time-range-section {
  .time-range-chart {
    margin-top: 20px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .questions-statistics {
    padding: 10px;
  }

  .card-header {
    flex-direction: column !important;
    gap: 12px !important;

    .header-actions {
      width: 100%;
      justify-content: center;
    }
  }

  .ranking-item {
    flex-direction: column !important;
    text-align: center;
    gap: 8px;
  }
}
</style>
