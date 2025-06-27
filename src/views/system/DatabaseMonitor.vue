<template>
  <div class="database-monitor container-responsive">
    <div class="page-header">
      <h1>数据库监控</h1>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading" icon="el-icon-refresh">
          刷新
        </el-button>
        <el-button @click="resetStats" type="warning" icon="el-icon-delete">
          重置统计
        </el-button>
        <el-button @click="testConnection" type="success" icon="el-icon-connection">
          测试连接
        </el-button>
      </div>
    </div>

    <!-- 状态概览 -->
    <div class="stats-responsive">
      <div class="card-responsive">
        <div class="stat-card" :class="getHealthStatusClass(healthStatus)">
          <div class="stat-icon">
            <i :class="getHealthStatusIcon(healthStatus)"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">健康状态</div>
            <div class="stat-value">{{ getHealthStatusText(healthStatus) }}</div>
          </div>
        </div>
      </div>

      <div class="card-responsive">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-connection"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">连接池使用率</div>
            <div class="stat-value">{{ poolUtilization }}%</div>
            <div class="stat-detail">{{ activeConnections }}/{{ poolSize }}</div>
          </div>
        </div>
      </div>

      <div class="card-responsive">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">平均查询时间</div>
            <div class="stat-value">{{ avgQueryTime }}ms</div>
          </div>
        </div>
      </div>

      <div class="card-responsive">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="el-icon-success"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">查询成功率</div>
            <div class="stat-value">{{ querySuccessRate }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 连接池状态 -->
    <div class="row-responsive">
      <div class="col-responsive col-6">
        <div class="card-responsive">
          <h3>连接池状态</h3>
          <div class="pool-status">
            <div class="pool-visual">
              <div class="pool-bar">
                <div 
                  class="pool-fill active" 
                  :style="{ width: (activeConnections / totalConnections * 100) + '%' }"
                ></div>
                <div 
                  class="pool-fill idle" 
                  :style="{ 
                    width: (idleConnections / totalConnections * 100) + '%',
                    left: (activeConnections / totalConnections * 100) + '%'
                  }"
                ></div>
                <div 
                  class="pool-fill overflow" 
                  :style="{ 
                    width: (overflowConnections / totalConnections * 100) + '%',
                    left: ((activeConnections + idleConnections) / totalConnections * 100) + '%'
                  }"
                ></div>
              </div>
              <div class="pool-legend">
                <div class="legend-item">
                  <span class="legend-color active"></span>
                  <span>活跃连接: {{ activeConnections }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color idle"></span>
                  <span>空闲连接: {{ idleConnections }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color overflow"></span>
                  <span>溢出连接: {{ overflowConnections }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-responsive col-6">
        <div class="card-responsive">
          <h3>查询统计</h3>
          <div class="query-stats">
            <div class="stat-row">
              <span class="stat-label">总查询数:</span>
              <span class="stat-value">{{ totalQueries }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">慢查询数:</span>
              <span class="stat-value text-warning">{{ slowQueries }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">失败查询数:</span>
              <span class="stat-value text-danger">{{ failedQueries }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">慢查询率:</span>
              <span class="stat-value" :class="slowQueryRate > 5 ? 'text-danger' : 'text-success'">
                {{ slowQueryRate }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优化建议 -->
    <div class="card-responsive" v-if="recommendations.length > 0">
      <h3>优化建议</h3>
      <div class="recommendations">
        <div 
          v-for="(recommendation, index) in recommendations" 
          :key="index"
          class="recommendation-item"
        >
          <i class="el-icon-warning-outline"></i>
          <span>{{ recommendation }}</span>
        </div>
      </div>
    </div>

    <!-- 详细信息表格 -->
    <div class="card-responsive">
      <h3>详细信息</h3>
      <div class="table-responsive">
        <el-table :data="detailData" stripe>
          <el-table-column prop="metric" label="指标" width="200"></el-table-column>
          <el-table-column prop="value" label="当前值"></el-table-column>
          <el-table-column prop="description" label="说明"></el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" :full-screen="false" text="加载监控数据..." />
  </div>
</template>

<script>
import { dbMonitorApi } from '@/api/dbMonitor'
import LoadingSpinner from '@/components/UX/LoadingSpinner.vue'
import { $message } from '@/utils/message'

export default {
  name: 'DatabaseMonitor',
  components: {
    LoadingSpinner
  },
  data() {
    return {
      loading: false,
      refreshTimer: null,
      
      // 监控数据
      healthStatus: 'healthy',
      poolSize: 0,
      activeConnections: 0,
      idleConnections: 0,
      overflowConnections: 0,
      totalConnections: 0,
      totalQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      avgQueryTime: 0,
      recommendations: []
    }
  },
  computed: {
    poolUtilization() {
      return this.poolSize > 0 ? Math.round((this.activeConnections / this.poolSize) * 100) : 0
    },
    querySuccessRate() {
      if (this.totalQueries === 0) return 100
      return Math.round(((this.totalQueries - this.failedQueries) / this.totalQueries) * 100)
    },
    slowQueryRate() {
      if (this.totalQueries === 0) return 0
      return Math.round((this.slowQueries / this.totalQueries) * 100)
    },
    detailData() {
      return [
        { metric: '连接池大小', value: this.poolSize, description: '配置的最大连接数' },
        { metric: '活跃连接', value: this.activeConnections, description: '当前正在使用的连接数' },
        { metric: '空闲连接', value: this.idleConnections, description: '当前空闲的连接数' },
        { metric: '溢出连接', value: this.overflowConnections, description: '超出连接池大小的连接数' },
        { metric: '总查询数', value: this.totalQueries, description: '累计执行的查询总数' },
        { metric: '慢查询数', value: this.slowQueries, description: '执行时间超过阈值的查询数' },
        { metric: '失败查询数', value: this.failedQueries, description: '执行失败的查询数' },
        { metric: '平均查询时间', value: `${this.avgQueryTime}ms`, description: '查询的平均执行时间' }
      ]
    }
  },
  mounted() {
    this.loadData()
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [statsResponse, healthResponse, optimizeResponse] = await Promise.all([
          dbMonitorApi.getStats(),
          dbMonitorApi.getHealth(),
          dbMonitorApi.getOptimizationRecommendations()
        ])

        // 处理统计数据
        const stats = statsResponse.data
        this.poolSize = stats.pool_stats.pool_size
        this.activeConnections = stats.pool_stats.active_connections
        this.idleConnections = stats.pool_stats.idle_connections
        this.overflowConnections = stats.pool_stats.overflow_connections
        this.totalConnections = stats.pool_stats.total_connections
        this.totalQueries = stats.query_stats.total_queries
        this.slowQueries = stats.query_stats.slow_queries
        this.failedQueries = stats.query_stats.failed_queries
        this.avgQueryTime = Math.round(stats.query_stats.avg_query_time * 1000)

        // 处理健康状态
        this.healthStatus = healthResponse.data.status

        // 处理优化建议
        this.recommendations = optimizeResponse.data.recommendations

      } catch (error) {
        $message.handleApiError(error, '加载监控数据失败')
      } finally {
        this.loading = false
      }
    },
    async refreshData() {
      await this.loadData()
      $message.success('监控数据已刷新')
    },
    async resetStats() {
      try {
        await dbMonitorApi.resetStats()
        $message.success('统计数据已重置')
        await this.loadData()
      } catch (error) {
        $message.handleApiError(error, '重置统计数据失败')
      }
    },
    async testConnection() {
      try {
        await dbMonitorApi.testConnection()
        $message.success('数据库连接测试成功')
      } catch (error) {
        $message.handleApiError(error, '数据库连接测试失败')
      }
    },
    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        this.loadData()
      }, 30000) // 30秒自动刷新
    },
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    getHealthStatusClass(status) {
      const classMap = {
        healthy: 'status-healthy',
        warning: 'status-warning',
        critical: 'status-critical'
      }
      return classMap[status] || 'status-unknown'
    },
    getHealthStatusIcon(status) {
      const iconMap = {
        healthy: 'el-icon-success',
        warning: 'el-icon-warning',
        critical: 'el-icon-error'
      }
      return iconMap[status] || 'el-icon-question'
    },
    getHealthStatusText(status) {
      const textMap = {
        healthy: '健康',
        warning: '警告',
        critical: '严重'
      }
      return textMap[status] || '未知'
    }
  }
}
</script>

<style lang="scss" scoped>
.database-monitor {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;

    &.status-healthy {
      background: linear-gradient(135deg, #67c23a, #85ce61);
      color: white;
    }

    &.status-warning {
      background: linear-gradient(135deg, #e6a23c, #ebb563);
      color: white;
    }

    &.status-critical {
      background: linear-gradient(135deg, #f56c6c, #f78989);
      color: white;
    }

    .stat-icon {
      font-size: 32px;
      margin-right: 16px;
      opacity: 0.8;
    }

    .stat-content {
      flex: 1;

      .stat-title {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .stat-detail {
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }

  .pool-status {
    .pool-visual {
      .pool-bar {
        position: relative;
        height: 30px;
        background: #f5f5f5;
        border-radius: 15px;
        overflow: hidden;
        margin-bottom: 16px;

        .pool-fill {
          position: absolute;
          height: 100%;
          transition: all 0.3s ease;

          &.active {
            background: #409eff;
          }

          &.idle {
            background: #67c23a;
          }

          &.overflow {
            background: #e6a23c;
          }
        }
      }

      .pool-legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        .legend-item {
          display: flex;
          align-items: center;
          font-size: 12px;

          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            margin-right: 6px;

            &.active { background: #409eff; }
            &.idle { background: #67c23a; }
            &.overflow { background: #e6a23c; }
          }
        }
      }
    }
  }

  .query-stats {
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .stat-label {
        color: #666;
      }

      .stat-value {
        font-weight: 500;

        &.text-warning { color: #e6a23c; }
        &.text-danger { color: #f56c6c; }
        &.text-success { color: #67c23a; }
      }
    }
  }

  .recommendations {
    .recommendation-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #fff7e6;
      border: 1px solid #ffd591;
      border-radius: 6px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      i {
        color: #fa8c16;
        margin-right: 8px;
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .database-monitor {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .header-actions {
        justify-content: center;
      }
    }

    .stat-card {
      padding: 16px;

      .stat-icon {
        font-size: 24px;
        margin-right: 12px;
      }

      .stat-content .stat-value {
        font-size: 20px;
      }
    }

    .pool-legend {
      flex-direction: column;
      gap: 8px;
    }
  }
}
</style>
