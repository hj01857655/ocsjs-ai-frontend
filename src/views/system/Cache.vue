<template>
  <div class="cache-management">
    <!-- 缓存状态概览 -->
    <el-row :gutter="20" class="status-cards">
      <el-col :xs="24" :sm="12" :lg="6" v-for="(stat, index) in cacheStats" :key="index">
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

    <!-- 缓存操作 -->
    <el-card class="operations-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Operation /></el-icon>
          <span>缓存操作</span>
        </div>
      </template>

      <div class="operations-grid">
        <div class="operation-item" @click="refreshCacheStatus">
          <div class="operation-icon" style="background-color: #409eff;">
            <el-icon><Refresh /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">刷新状态</div>
            <div class="operation-desc">获取最新的缓存状态信息</div>
          </div>
        </div>

        <div class="operation-item" @click="clearAllCacheAction">
          <div class="operation-icon" style="background-color: #f56c6c;">
            <el-icon><Delete /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">清空缓存</div>
            <div class="operation-desc">清除所有缓存数据</div>
          </div>
        </div>

        <div class="operation-item" @click="preloadCacheAction">
          <div class="operation-icon" style="background-color: #67c23a;">
            <el-icon><Download /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">缓存预热</div>
            <div class="operation-desc">预加载热门题目到缓存</div>
          </div>
        </div>

        <div class="operation-item" @click="showCacheConfig">
          <div class="operation-icon" style="background-color: #e6a23c;">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="operation-content">
            <div class="operation-title">缓存配置</div>
            <div class="operation-desc">修改缓存相关配置</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 缓存详情 -->
    <el-row :gutter="20">
      <!-- 缓存统计图表 -->
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>缓存性能趋势</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="updateChart">
                <el-radio-button value="1h">1小时</el-radio-button>
                <el-radio-button value="24h">24小时</el-radio-button>
                <el-radio-button value="7d">7天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="chartOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>

      <!-- 热门缓存 -->
      <el-col :xs="24" :lg="8">
        <el-card class="hot-cache-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Star /></el-icon>
              <span>热门缓存</span>
            </div>
          </template>
          <div class="hot-cache-list">
            <div v-if="hotCacheItems.length === 0" class="empty-state">
              <el-empty description="暂无热门缓存数据" />
            </div>
            <div
              v-for="(item, index) in hotCacheItems"
              :key="index"
              class="hot-cache-item"
            >
              <div class="cache-rank">{{ index + 1 }}</div>
              <div class="cache-content">
                <div class="cache-key">{{ item.key }}</div>
                <div class="cache-meta">
                  <span class="cache-hits">{{ item.hits }} 次访问</span>
                  <span class="cache-size">{{ item.size }}</span>
                </div>
              </div>
              <div class="cache-actions">
                <el-button link size="small" @click="viewCacheDetail(item)">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button link size="small" @click="deleteCacheItem(item)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 缓存键管理 -->
    <el-card class="keys-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Key /></el-icon>
          <span>缓存键管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchKey"
              placeholder="搜索缓存键..."
              style="width: 200px"
              @keyup.enter="searchCacheKeys"
            >
              <template #append>
                <el-button @click="searchCacheKeys" :icon="Search" />
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <el-table
        v-loading="keysLoading"
        :data="cacheKeys"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="key" label="缓存键" min-width="300" show-overflow-tooltip />
        <el-table-column prop="type" label="数据类型" width="100" />
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column prop="ttl" label="剩余时间" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.ttl === -1" type="warning">永不过期</el-tag>
            <el-tag v-else-if="row.ttl > 0" type="success">{{ formatTTL(row.ttl) }}</el-tag>
            <el-tag v-else type="danger">已过期</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewCacheDetail(row)">查看</el-button>
            <el-button type="danger" size="small" @click="deleteCacheItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="keysPagination.page"
          v-model:page-size="keysPagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="keysPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCacheKeys"
          @current-change="loadCacheKeys"
        />
      </div>
    </el-card>

    <!-- 缓存详情对话框 -->
    <el-dialog v-model="detailVisible" title="缓存详情" width="800px">
      <div v-if="currentCacheItem" class="cache-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="缓存键">{{ currentCacheItem.key }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">{{ currentCacheItem.type }}</el-descriptions-item>
          <el-descriptions-item label="数据大小">{{ currentCacheItem.size }}</el-descriptions-item>
          <el-descriptions-item label="剩余时间">
            <el-tag v-if="currentCacheItem.ttl === -1" type="warning">永不过期</el-tag>
            <el-tag v-else-if="currentCacheItem.ttl > 0" type="success">{{ formatTTL(currentCacheItem.ttl) }}</el-tag>
            <el-tag v-else type="danger">已过期</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ currentCacheItem.created_at }}</el-descriptions-item>
        </el-descriptions>

        <div class="cache-value">
          <h4>缓存内容</h4>
          <el-input
            v-model="currentCacheItem.value"
            type="textarea"
            :rows="10"
            readonly
            style="font-family: monospace;"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 缓存配置对话框 -->
    <el-dialog v-model="configVisible" title="缓存配置" width="600px">
      <el-form :model="cacheConfig" label-width="120px">
        <el-form-item label="默认过期时间">
          <el-input-number
            v-model="cacheConfig.expiration"
            :min="60"
            :max="86400"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 8px; color: #909399;">秒</span>
        </el-form-item>
        <el-form-item label="热门缓存时间">
          <el-input-number
            v-model="cacheConfig.cache_levels.hot"
            :min="60"
            :max="86400"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 8px; color: #909399;">秒</span>
        </el-form-item>
        <el-form-item label="普通缓存时间">
          <el-input-number
            v-model="cacheConfig.cache_levels.normal"
            :min="60"
            :max="86400"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 8px; color: #909399;">秒</span>
        </el-form-item>
        <el-form-item label="冷门缓存时间">
          <el-input-number
            v-model="cacheConfig.cache_levels.cold"
            :min="60"
            :max="86400"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 8px; color: #909399;">秒</span>
        </el-form-item>
        <el-form-item label="最大缓存数量">
          <el-input-number
            v-model="cacheConfig.max_keys"
            :min="1000"
            :max="100000"
            controls-position="right"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="自动清理">
          <el-switch v-model="cacheConfig.auto_cleanup" />
        </el-form-item>
        <el-form-item label="清理间隔">
          <el-input-number
            v-model="cacheConfig.cleanup_interval"
            :min="300"
            :max="3600"
            :disabled="!cacheConfig.auto_cleanup"
            controls-position="right"
            style="width: 200px"
          />
          <span style="margin-left: 8px; color: #909399;">秒</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCacheConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Operation,
  Refresh,
  Delete,
  Download,
  Setting,
  TrendCharts,
  Star,
  Key,
  Search,
  View,
  CircleCheck,
  WarningFilled,
  Coin,
  Timer,
  DataBoard
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import {
  getCacheStatus,
  clearAllCache,
  getCacheKeys,
  getCacheKeyDetail,
  deleteCacheKey,
  getHotCache,
  preloadCache,
  getCacheConfig,
  updateCacheConfig,
  getCacheStatsHistory
} from '@/api/cache'

// 响应式数据
const chartPeriod = ref('24h')
const searchKey = ref('')
const keysLoading = ref(false)
const detailVisible = ref(false)
const configVisible = ref(false)
const currentCacheItem = ref(null)

const cacheStats = ref([
  {
    label: '缓存大小',
    value: '0',
    icon: 'Coin',
    color: '#409eff',
    status: 'normal',
    statusIcon: 'CircleCheck',
    statusText: '正常'
  },
  {
    label: '命中率',
    value: '0%',
    icon: 'TrendCharts',
    color: '#67c23a',
    status: 'good',
    statusIcon: 'CircleCheck',
    statusText: '良好'
  },
  {
    label: '内存使用',
    value: '0MB',
    icon: 'DataBoard',
    color: '#e6a23c',
    status: 'warning',
    statusIcon: 'WarningFilled',
    statusText: '注意'
  },
  {
    label: '连接状态',
    value: '未连接',
    icon: 'Timer',
    color: '#f56c6c',
    status: 'error',
    statusIcon: 'WarningFilled',
    statusText: '错误'
  }
])

const hotCacheItems = ref([])

const cacheKeys = ref([])

const keysPagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const cacheConfig = reactive({
  expiration: 3600,
  cache_levels: {
    hot: 7200,
    normal: 3600,
    cold: 1800
  },
  auto_cleanup: true,
  cleanup_interval: 600,
  max_keys: 10000
})

// 图表配置
const chartOption = computed(() => {
  const chartData = historyData.value
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['命中率', '请求数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.time_str)
    },
    yAxis: [
      {
        type: 'value',
        name: '命中率(%)',
        min: 0,
        max: 100
      },
      {
        type: 'value',
        name: '请求数',
        min: 0
      }
    ],
    series: [
      {
        name: '命中率',
        type: 'line',
        data: chartData.map(item => item.hit_rate),
        smooth: true,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '请求数',
        type: 'bar',
        yAxisIndex: 1,
        data: chartData.map(item => item.requests),
        itemStyle: { color: '#409eff' }
      }
    ]
  }
})

const historyData = ref([])

// 方法
const refreshCacheStatus = async () => {
  try {
    const response = await getCacheStatus()
    if (response.success) {
      const data = response.data
      
      // 更新缓存统计信息
      cacheStats.value[0].value = data.cache_size.toString()
      cacheStats.value[1].value = `${data.hit_rate}%`
      
      // 更新内存使用信息
      if (data.memory_usage) {
        cacheStats.value[2].value = data.memory_usage.used_memory_human
        
        // 根据内存使用率设置状态
        const memoryRatio = data.memory_usage.mem_fragmentation_ratio || 0
        if (memoryRatio > 2) {
          cacheStats.value[2].status = 'warning'
          cacheStats.value[2].statusIcon = 'WarningFilled'
          cacheStats.value[2].statusText = '注意'
        } else {
          cacheStats.value[2].status = 'normal'
          cacheStats.value[2].statusIcon = 'CircleCheck'
          cacheStats.value[2].statusText = '正常'
        }
      }
      
      // 更新连接状态
      cacheStats.value[3].value = data.is_connected ? '已连接' : '未连接'
      if (data.is_connected) {
        cacheStats.value[3].status = 'normal'
        cacheStats.value[3].statusIcon = 'CircleCheck'
        cacheStats.value[3].statusText = '正常'
        cacheStats.value[3].color = '#67c23a'
      } else {
        cacheStats.value[3].status = 'error'
        cacheStats.value[3].statusIcon = 'WarningFilled'
        cacheStats.value[3].statusText = '错误'
        cacheStats.value[3].color = '#f56c6c'
      }
      
      // 根据命中率设置状态
      const hitRate = data.hit_rate || 0
      if (hitRate >= 80) {
        cacheStats.value[1].status = 'good'
        cacheStats.value[1].statusIcon = 'CircleCheck'
        cacheStats.value[1].statusText = '良好'
      } else if (hitRate >= 50) {
        cacheStats.value[1].status = 'normal'
        cacheStats.value[1].statusIcon = 'CircleCheck'
        cacheStats.value[1].statusText = '正常'
      } else {
        cacheStats.value[1].status = 'warning'
        cacheStats.value[1].statusIcon = 'WarningFilled'
        cacheStats.value[1].statusText = '较低'
      }
      
      ElMessage.success('缓存状态已刷新')
    } else {
      ElMessage.error(response.message || '刷新失败')
    }
  } catch (error) {
    ElMessage.error('刷新失败')
    console.error('刷新缓存状态失败:', error)
  }
}

const clearAllCacheAction = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有缓存吗？此操作不可恢复！', '警告', {
      type: 'warning'
    })

    const response = await clearAllCache()
    if (response.success) {
      ElMessage.success(response.message || '缓存已清空')
      loadCacheKeys()
      loadHotCache()
      refreshCacheStatus()
    } else {
      ElMessage.error(response.message || '清空缓存失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空缓存失败')
      console.error('清空缓存失败:', error)
    }
  }
}

const preloadCacheAction = async () => {
  try {
    await ElMessageBox.confirm('确定要进行缓存预热吗？这可能需要一些时间。', '提示', {
      type: 'info'
    })

    // 获取热门问题数据
    const questions = [
      { question: "什么是Vue.js?", question_type: "single", options: ["前端框架", "后端框架"] },
      { question: "React是由哪家公司开发的?", question_type: "single", options: ["Facebook", "Google"] },
      { question: "JavaScript是一种什么类型的语言?", question_type: "single", options: ["解释型", "编译型"] }
    ]

    const response = await preloadCache(questions)
    if (response.success) {
      ElMessage.success(response.message || '缓存预热完成')
      loadCacheKeys()
      loadHotCache()
      refreshCacheStatus()
    } else {
      ElMessage.error(response.message || '缓存预热失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('缓存预热失败')
      console.error('缓存预热失败:', error)
    }
  }
}

const showCacheConfig = async () => {
  try {
    const response = await getCacheConfig()
    if (response.success) {
      const config = response.data
      
      // 更新配置表单
      cacheConfig.expiration = config.expiration
      cacheConfig.cache_levels = config.cache_levels || {
        hot: 7200,
        normal: 3600,
        cold: 1800
      }
      cacheConfig.auto_cleanup = config.auto_cleanup || false
      cacheConfig.cleanup_interval = config.cleanup_interval || 600
      cacheConfig.max_keys = config.max_keys || 10000
      
      configVisible.value = true
    } else {
      ElMessage.error(response.message || '获取缓存配置失败')
    }
  } catch (error) {
    ElMessage.error('获取缓存配置失败')
    console.error('获取缓存配置失败:', error)
  }
}

const updateChart = async () => {
  try {
    const response = await getCacheStatsHistory(chartPeriod.value)
    if (response.success) {
      historyData.value = response.data.history
    } else {
      ElMessage.error(response.message || '获取统计数据失败')
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
    console.error('获取统计数据失败:', error)
  }
}

const searchCacheKeys = () => {
  keysPagination.page = 1
  loadCacheKeys()
}

const loadCacheKeys = async () => {
  keysLoading.value = true
  try {
    const params = {
      pattern: searchKey.value ? `*${searchKey.value}*` : 'qa_cache:*',
      page: keysPagination.page,
      per_page: keysPagination.size
    }
    
    const response = await getCacheKeys(params)
    if (response.success) {
      cacheKeys.value = response.data.keys
      keysPagination.total = response.data.pagination.total
    } else {
      ElMessage.error(response.message || '加载缓存键失败')
    }
  } catch (error) {
    ElMessage.error('加载缓存键失败')
    console.error('加载缓存键失败:', error)
  } finally {
    keysLoading.value = false
  }
}

const loadHotCache = async () => {
  try {
    const response = await getHotCache(10)
    if (response.success) {
      hotCacheItems.value = response.data
    } else {
      ElMessage.error(response.message || '加载热门缓存失败')
    }
  } catch (error) {
    ElMessage.error('加载热门缓存失败')
    console.error('加载热门缓存失败:', error)
  }
}

const viewCacheDetail = async (item) => {
  try {
    const response = await getCacheKeyDetail(item.key)
    if (response.success) {
      currentCacheItem.value = response.data
      detailVisible.value = true
    } else {
      ElMessage.error(response.message || '获取缓存详情失败')
    }
  } catch (error) {
    ElMessage.error('获取缓存详情失败')
    console.error('获取缓存详情失败:', error)
  }
}

const deleteCacheItem = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要删除缓存键 "${item.key}" 吗？`, '警告', {
      type: 'warning'
    })
    
    const response = await deleteCacheKey(item.key)
    if (response.success) {
      ElMessage.success('缓存键删除成功')
      loadCacheKeys()
      loadHotCache()
      refreshCacheStatus()
    } else {
      ElMessage.error(response.message || '删除缓存键失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除缓存键失败')
      console.error('删除缓存键失败:', error)
    }
  }
}

const saveCacheConfig = async () => {
  try {
    const response = await updateCacheConfig(cacheConfig)
    if (response.success) {
      ElMessage.success('缓存配置更新成功')
      configVisible.value = false
      refreshCacheStatus()
    } else {
      ElMessage.error(response.message || '更新缓存配置失败')
    }
  } catch (error) {
    ElMessage.error('更新缓存配置失败')
    console.error('更新缓存配置失败:', error)
  }
}

const formatTTL = (seconds) => {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分钟`
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}小时`
  } else {
    return `${Math.floor(seconds / 86400)}天`
  }
}

// 生命周期
onMounted(() => {
  refreshCacheStatus()
  loadCacheKeys()
  loadHotCache()
  updateChart()
})
</script>

<style lang="scss" scoped>
.cache-management {
  padding: 20px;
}

.status-cards {
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

.chart-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.hot-cache-card {
  .hot-cache-list {
    .hot-cache-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .cache-rank {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #409eff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        margin-right: 12px;
      }

      .cache-content {
        flex: 1;

        .cache-key {
          font-size: 14px;
          margin-bottom: 4px;
          font-family: monospace;
        }

        .cache-meta {
          font-size: 12px;
          color: #909399;

          .cache-hits {
            margin-right: 12px;
          }
        }
      }

      .cache-actions {
        display: flex;
        gap: 4px;
      }
    }
  }
}

.keys-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-wrapper {
    margin-top: 20px;
    text-align: right;
  }
}

.cache-detail {
  .cache-value {
    margin-top: 20px;

    h4 {
      margin: 0 0 12px 0;
      color: #303133;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .cache-management {
    padding: 10px;
  }

  .operations-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
