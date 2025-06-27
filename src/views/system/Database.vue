<template>
  <div class="database-management">
    <!-- 数据库状态概览 -->
    <el-row :gutter="20" class="status-overview">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(stat, index) in dbStats" :key="index">
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
          <div class="stat-status" :class="stat.status">
            <el-icon><component :is="stat.statusIcon" /></el-icon>
            <span>{{ stat.statusText }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据库操作 -->
    <el-card class="operations-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Operation /></el-icon>
          <span>数据库操作</span>
        </div>
      </template>
      
      <div class="operations-grid">
        <div class="operation-item" @click="optimizeDatabase">
          <div class="operation-icon" style="background-color: #409eff;">
            <el-icon><Tools /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">数据库优化</div>
            <div class="operation-desc">优化表结构和索引</div>
          </div>
        </div>
        
        <div class="operation-item" @click="backupDatabase">
          <div class="operation-icon" style="background-color: #67c23a;">
            <el-icon><Download /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">数据备份</div>
            <div class="operation-desc">创建数据库备份</div>
          </div>
        </div>
        
        <div class="operation-item" @click="analyzePerformance">
          <div class="operation-icon" style="background-color: #e6a23c;">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">性能分析</div>
            <div class="operation-desc">分析查询性能</div>
          </div>
        </div>
        
        <div class="operation-item" @click="cleanupData">
          <div class="operation-icon" style="background-color: #f56c6c;">
            <el-icon><Delete /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">数据清理</div>
            <div class="operation-desc">清理过期数据</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 性能监控 -->
    <el-row :gutter="20" class="monitoring-section">
      <!-- 查询性能图表 -->
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>查询性能监控</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="updateChart">
                <el-radio-button value="1h">1小时</el-radio-button>
                <el-radio-button value="24h">24小时</el-radio-button>
                <el-radio-button value="7d">7天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="performanceChartOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>

      <!-- 连接池状态 -->
      <el-col :xs="24" :lg="8">
        <el-card class="pool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Connection /></el-icon>
              <span>连接池状态</span>
            </div>
          </template>
          <div class="pool-status">
            <div class="pool-item">
              <div class="pool-label">活跃连接</div>
              <div class="pool-value">{{ connectionPool.active }}</div>
              <el-progress
                :percentage="(connectionPool.active / connectionPool.max) * 100"
                :status="getPoolStatus(connectionPool.active / connectionPool.max)"
                :stroke-width="8"
                :show-text="false"
              />
            </div>
            <div class="pool-item">
              <div class="pool-label">空闲连接</div>
              <div class="pool-value">{{ connectionPool.idle }}</div>
              <el-progress
                :percentage="(connectionPool.idle / connectionPool.max) * 100"
                status="success"
                :stroke-width="8"
                :show-text="false"
              />
            </div>
            <div class="pool-item">
              <div class="pool-label">最大连接</div>
              <div class="pool-value">{{ connectionPool.max }}</div>
            </div>
            <div class="pool-item">
              <div class="pool-label">等待队列</div>
              <div class="pool-value">{{ connectionPool.waiting }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 慢查询分析 -->
    <el-card class="slow-queries-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Warning /></el-icon>
          <span>慢查询分析</span>
          <div class="header-actions">
            <el-input
              v-model="queryFilter"
              placeholder="搜索查询..."
              style="width: 200px"
              @keyup.enter="filterQueries"
            >
              <template #append>
                <el-button @click="filterQueries" :icon="Search" />
              </template>
            </el-input>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="queriesLoading"
        :data="slowQueries"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="query" label="查询语句" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="query-code">{{ row.query }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="execution_time" label="执行时间" width="120" sortable>
          <template #default="{ row }">
            <el-tag :type="getTimeTagType(row.execution_time)">{{ row.execution_time }}ms</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rows_examined" label="扫描行数" width="120" sortable />
        <el-table-column prop="rows_sent" label="返回行数" width="120" sortable />
        <el-table-column prop="frequency" label="执行频率" width="120" sortable />
        <el-table-column prop="last_seen" label="最后执行" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="explainQuery(row)">分析</el-button>
            <el-button type="warning" size="small" @click="optimizeQuery(row)">优化</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryPagination.page"
          v-model:page-size="queryPagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="queryPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadSlowQueries"
          @current-change="loadSlowQueries"
        />
      </div>
    </el-card>

    <!-- 表空间使用情况 -->
    <el-card class="tablespace-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><DataBoard /></el-icon>
          <span>表空间使用情况</span>
        </div>
      </template>
      
      <el-table
        :data="tablespaceData"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="table_name" label="表名" width="200" />
        <el-table-column prop="rows_count" label="记录数" width="120" sortable />
        <el-table-column prop="data_size" label="数据大小" width="120" sortable />
        <el-table-column prop="index_size" label="索引大小" width="120" sortable />
        <el-table-column prop="total_size" label="总大小" width="120" sortable />
        <el-table-column prop="growth_rate" label="增长率" width="120">
          <template #default="{ row }">
            <el-tag :type="row.growth_rate > 10 ? 'warning' : 'success'">
              {{ row.growth_rate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_updated" label="最后更新" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="analyzeTable(row)">分析</el-button>
            <el-button type="success" size="small" @click="optimizeTable(row)">优化</el-button>
            <el-button type="warning" size="small" @click="repairTable(row)">修复</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 查询分析对话框 -->
    <el-dialog v-model="explainVisible" title="查询分析" width="800px">
      <div v-if="currentQuery" class="query-analysis">
        <div class="analysis-section">
          <h4>查询语句</h4>
          <el-input
            v-model="currentQuery.query"
            type="textarea"
            :rows="3"
            readonly
            style="font-family: monospace;"
          />
        </div>
        
        <div class="analysis-section">
          <h4>执行计划</h4>
          <el-table :data="currentQuery.explain" border size="small">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="select_type" label="类型" width="120" />
            <el-table-column prop="table" label="表" width="100" />
            <el-table-column prop="type" label="访问类型" width="100" />
            <el-table-column prop="key" label="索引" width="100" />
            <el-table-column prop="rows" label="扫描行数" width="100" />
            <el-table-column prop="extra" label="额外信息" show-overflow-tooltip />
          </el-table>
        </div>
        
        <div class="analysis-section">
          <h4>优化建议</h4>
          <ul class="optimization-suggestions">
            <li v-for="suggestion in currentQuery.suggestions" :key="suggestion">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Operation,
  Tools,
  Download,
  DataAnalysis,
  Delete,
  TrendCharts,
  Connection,
  Warning,
  Search,
  DataBoard,
  CircleCheck,
  WarningFilled,
  Timer,
  Coin
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'

// 响应式数据
const chartPeriod = ref('24h')
const queryFilter = ref('')
const queriesLoading = ref(false)
const explainVisible = ref(false)
const currentQuery = ref(null)

const dbStats = ref([
  {
    label: '数据库大小',
    value: '2.3GB',
    icon: 'DataBoard',
    color: '#409eff',
    status: 'normal',
    statusIcon: 'CircleCheck',
    statusText: '正常'
  },
  {
    label: '平均响应时间',
    value: '45ms',
    icon: 'Timer',
    color: '#67c23a',
    status: 'good',
    statusIcon: 'CircleCheck',
    statusText: '良好'
  },
  {
    label: '活跃连接数',
    value: '23/100',
    icon: 'Connection',
    color: '#e6a23c',
    status: 'normal',
    statusIcon: 'CircleCheck',
    statusText: '正常'
  },
  {
    label: '慢查询数量',
    value: '12',
    icon: 'Warning',
    color: '#f56c6c',
    status: 'warning',
    statusIcon: 'WarningFilled',
    statusText: '注意'
  }
])

const connectionPool = reactive({
  active: 23,
  idle: 45,
  max: 100,
  waiting: 2
})

const slowQueries = ref([])
const tablespaceData = ref([])

const queryPagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 图表配置
const performanceChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['查询时间', 'QPS']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
  },
  yAxis: [
    {
      type: 'value',
      name: '响应时间(ms)',
      min: 0
    },
    {
      type: 'value',
      name: 'QPS',
      min: 0
    }
  ],
  series: [
    {
      name: '查询时间',
      type: 'line',
      data: [45, 52, 38, 67, 43, 58, 41],
      smooth: true,
      itemStyle: { color: '#409eff' }
    },
    {
      name: 'QPS',
      type: 'bar',
      yAxisIndex: 1,
      data: [120, 132, 101, 134, 90, 230, 210],
      itemStyle: { color: '#67c23a' }
    }
  ]
}))

// 方法
const optimizeDatabase = async () => {
  try {
    await ElMessageBox.confirm('确定要优化数据库吗？这可能需要一些时间。', '提示', {
      type: 'info'
    })
    
    ElMessage.success('数据库优化已开始，请稍候...')
    // 模拟优化过程
    setTimeout(() => {
      ElMessage.success('数据库优化完成')
    }, 3000)
  } catch {
    // 用户取消
  }
}

const backupDatabase = async () => {
  try {
    await ElMessageBox.confirm('确定要创建数据库备份吗？', '提示', {
      type: 'info'
    })
    
    ElMessage.success('数据库备份已开始...')
    // 模拟备份过程
    setTimeout(() => {
      ElMessage.success('数据库备份完成')
    }, 5000)
  } catch {
    // 用户取消
  }
}

const analyzePerformance = () => {
  ElMessage.info('正在分析数据库性能...')
  // 模拟性能分析
  setTimeout(() => {
    ElMessage.success('性能分析完成，请查看报告')
  }, 2000)
}

const cleanupData = async () => {
  try {
    await ElMessageBox.confirm('确定要清理过期数据吗？此操作不可恢复！', '警告', {
      type: 'warning'
    })
    
    ElMessage.success('数据清理已开始...')
    // 模拟清理过程
    setTimeout(() => {
      ElMessage.success('数据清理完成')
    }, 3000)
  } catch {
    // 用户取消
  }
}

const updateChart = () => {
  console.log('更新图表:', chartPeriod.value)
}

const getPoolStatus = (ratio) => {
  if (ratio >= 0.8) return 'exception'
  if (ratio >= 0.6) return 'warning'
  return 'success'
}

const filterQueries = () => {
  queryPagination.page = 1
  loadSlowQueries()
}

const loadSlowQueries = async () => {
  queriesLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    slowQueries.value = Array.from({ length: 20 }, (_, index) => ({
      query: `SELECT * FROM questions WHERE title LIKE '%${index}%' ORDER BY created_at DESC`,
      execution_time: Math.floor(Math.random() * 2000) + 100,
      rows_examined: Math.floor(Math.random() * 10000) + 100,
      rows_sent: Math.floor(Math.random() * 100) + 1,
      frequency: Math.floor(Math.random() * 50) + 1,
      last_seen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString()
    }))
    
    queryPagination.total = 200
  } catch (error) {
    ElMessage.error('加载慢查询失败')
  } finally {
    queriesLoading.value = false
  }
}

const getTimeTagType = (time) => {
  if (time >= 1000) return 'danger'
  if (time >= 500) return 'warning'
  return 'success'
}

const explainQuery = (query) => {
  currentQuery.value = {
    ...query,
    explain: [
      {
        id: 1,
        select_type: 'SIMPLE',
        table: 'questions',
        type: 'ALL',
        key: null,
        rows: 10000,
        extra: 'Using where; Using filesort'
      }
    ],
    suggestions: [
      '建议在title字段上创建索引',
      '考虑使用LIMIT限制返回结果数量',
      '避免使用SELECT *，只选择需要的字段'
    ]
  }
  explainVisible.value = true
}

const optimizeQuery = (query) => {
  ElMessage.info(`正在优化查询: ${query.query.substring(0, 50)}...`)
}

const loadTablespaceData = () => {
  tablespaceData.value = [
    {
      table_name: 'questions',
      rows_count: '1,234,567',
      data_size: '256MB',
      index_size: '64MB',
      total_size: '320MB',
      growth_rate: 15.2,
      last_updated: '2024-01-15 14:30:00'
    },
    {
      table_name: 'users',
      rows_count: '45,678',
      data_size: '12MB',
      index_size: '3MB',
      total_size: '15MB',
      growth_rate: 8.5,
      last_updated: '2024-01-15 13:45:00'
    },
    {
      table_name: 'search_logs',
      rows_count: '2,345,678',
      data_size: '512MB',
      index_size: '128MB',
      total_size: '640MB',
      growth_rate: 25.8,
      last_updated: '2024-01-15 15:20:00'
    }
  ]
}

const analyzeTable = (table) => {
  ElMessage.info(`正在分析表: ${table.table_name}`)
}

const optimizeTable = (table) => {
  ElMessage.info(`正在优化表: ${table.table_name}`)
}

const repairTable = (table) => {
  ElMessage.info(`正在修复表: ${table.table_name}`)
}

// 生命周期
onMounted(() => {
  loadSlowQueries()
  loadTablespaceData()
})
</script>

<style lang="scss" scoped>
.database-management {
  padding: 20px;
}

.status-overview {
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
    
    .stat-status {
      display: flex;
      align-items: center;
      font-size: 12px;
      
      &.normal, &.good {
        color: #67c23a;
      }
      
      &.warning {
        color: #e6a23c;
      }
      
      &.error {
        color: #f56c6c;
      }
      
      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

.operations-card {
  margin-bottom: 20px;
  
  .operations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    
    .operation-item {
      display: flex;
      align-items: center;
      padding: 20px;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
      }
      
      .operation-icon {
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
      
      .operation-content {
        .operation-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 5px;
        }
        
        .operation-desc {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.monitoring-section {
  margin-bottom: 20px;
  
  .chart-card,
  .pool-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .pool-status {
    .pool-item {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .pool-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;
      }
      
      .pool-value {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 8px;
      }
    }
  }
}

.slow-queries-card,
.tablespace-card {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .query-code {
    font-family: 'Courier New', monospace;
    background: #f5f7fa;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 12px;
  }
  
  .pagination-wrapper {
    margin-top: 20px;
    text-align: right;
  }
}

.query-analysis {
  .analysis-section {
    margin-bottom: 24px;
    
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      font-weight: 500;
    }
    
    .optimization-suggestions {
      margin: 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 8px;
        line-height: 1.6;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .database-management {
    padding: 10px;
  }
  
  .operations-grid {
    grid-template-columns: 1fr !important;
  }
  
  .card-header {
    flex-direction: column !important;
    gap: 12px;
  }
}
</style>
