<template>
  <div class="network-error" :class="{ 'full-screen': fullScreen }">
    <div class="error-content">
      <div class="error-animation">
        <div class="wifi-symbol" :class="{ 'disconnected': !isConnected }">
          <div class="wifi-circle"></div>
          <div class="wifi-circle"></div>
          <div class="wifi-circle"></div>
        </div>
      </div>
      
      <div class="error-info">
        <h3 class="error-title">{{ errorTitle }}</h3>
        <p class="error-message">{{ errorMessage }}</p>
        
        <div class="connection-status">
          <div class="status-item">
            <span class="status-label">网络状态:</span>
            <span class="status-value" :class="networkStatusClass">
              {{ networkStatusText }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">服务器状态:</span>
            <span class="status-value" :class="serverStatusClass">
              {{ serverStatusText }}
            </span>
          </div>
        </div>
        
        <div class="error-actions">
          <el-button 
            @click="checkConnection" 
            :loading="checking" 
            type="primary" 
            icon="el-icon-refresh"
          >
            {{ checking ? '检测中...' : '重新检测' }}
          </el-button>
          <el-button @click="retry" icon="el-icon-refresh">
            重试请求
          </el-button>
          <el-button @click="goOffline" type="info" plain>
            离线模式
          </el-button>
        </div>
        
        <div class="troubleshooting">
          <el-collapse>
            <el-collapse-item title="故障排除建议" name="troubleshooting">
              <div class="troubleshooting-content">
                <div class="troubleshooting-item">
                  <i class="el-icon-check"></i>
                  <span>检查网络连接是否正常</span>
                </div>
                <div class="troubleshooting-item">
                  <i class="el-icon-check"></i>
                  <span>确认服务器地址是否正确</span>
                </div>
                <div class="troubleshooting-item">
                  <i class="el-icon-check"></i>
                  <span>尝试刷新页面或重启浏览器</span>
                </div>
                <div class="troubleshooting-item">
                  <i class="el-icon-check"></i>
                  <span>检查防火墙或代理设置</span>
                </div>
                <div class="troubleshooting-item">
                  <i class="el-icon-check"></i>
                  <span>联系技术支持获取帮助</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { checkNetworkConnection, getConnectionQuality, setupNetworkListeners } from '@/utils/health'

export default {
  name: 'NetworkError',
  props: {
    fullScreen: {
      type: Boolean,
      default: false
    },
    errorType: {
      type: String,
      default: 'network',
      validator: value => ['network', 'timeout', 'server', 'cors'].includes(value)
    },
    customTitle: {
      type: String,
      default: ''
    },
    customMessage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      checking: false,
      connectionStatus: {
        isConnected: navigator.onLine,
        serverReachable: false,
        latency: null,
        error: null
      },
      lastCheckTime: null,
      cleanupNetworkListeners: null
    }
  },
  computed: {
    errorTitle() {
      if (this.customTitle) return this.customTitle
      
      const titleMap = {
        network: '网络连接失败',
        timeout: '请求超时',
        server: '服务器错误',
        cors: '跨域请求被阻止'
      }
      return titleMap[this.errorType] || '网络错误'
    },
    errorMessage() {
      if (this.customMessage) return this.customMessage
      
      const messageMap = {
        network: '无法连接到服务器，请检查您的网络连接。',
        timeout: '请求处理时间过长，请稍后重试。',
        server: '服务器暂时无法处理您的请求，请稍后重试。',
        cors: '浏览器安全策略阻止了此请求，请联系管理员。'
      }
      return messageMap[this.errorType] || '发生了网络错误，请稍后重试。'
    },
    networkStatusClass() {
      return this.connectionStatus.isConnected ? 'status-online' : 'status-offline'
    },
    networkStatusText() {
      return this.connectionStatus.isConnected ? '已连接' : '未连接'
    },
    serverStatusClass() {
      return this.connectionStatus.serverReachable ? 'status-online' : 'status-offline'
    },
    serverStatusText() {
      if (this.lastCheckTime === null) return '未检测'
      return this.connectionStatus.serverReachable ? '可访问' : '不可访问'
    },
    connectionQuality() {
      return getConnectionQuality(this.connectionStatus.latency)
    }
  },
  mounted() {
    this.setupNetworkListeners()
    this.checkConnection()
  },
  beforeUnmount() {
    if (this.cleanupNetworkListeners) {
      this.cleanupNetworkListeners()
    }
  },
  methods: {
    setupNetworkListeners() {
      this.cleanupNetworkListeners = setupNetworkListeners(
        () => this.handleOnline(),
        () => this.handleOffline()
      )
    },
    handleOnline() {
      this.connectionStatus.isConnected = true
      this.checkConnection()
    },
    handleOffline() {
      this.connectionStatus.isConnected = false
      this.connectionStatus.serverReachable = false
      this.connectionStatus.error = '网络连接断开'
    },
    async checkConnection() {
      this.checking = true
      this.lastCheckTime = new Date()

      try {
        const result = await checkNetworkConnection()
        this.connectionStatus = { ...result }
      } catch (error) {
        this.connectionStatus.error = error.message
        this.connectionStatus.isConnected = false
        this.connectionStatus.serverReachable = false
      }
      } catch (error) {
        this.serverReachable = false
      } finally {
        this.checking = false
      }
    },
    retry() {
      this.$emit('retry')
    },
    goOffline() {
      this.$emit('offline')
    }
  }
}
</script>

<style lang="scss" scoped>
.network-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  &.full-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.95);
    z-index: 9999;
  }
}

.error-content {
  max-width: 500px;
  text-align: center;
}

.error-animation {
  margin-bottom: 32px;
  
  .wifi-symbol {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto;
    
    .wifi-circle {
      position: absolute;
      border: 3px solid #409eff;
      border-radius: 50%;
      opacity: 0.7;
      
      &:nth-child(1) {
        width: 20px;
        height: 20px;
        top: 30px;
        left: 30px;
        animation: wifi-pulse 2s infinite;
      }
      
      &:nth-child(2) {
        width: 40px;
        height: 40px;
        top: 20px;
        left: 20px;
        animation: wifi-pulse 2s infinite 0.5s;
      }
      
      &:nth-child(3) {
        width: 60px;
        height: 60px;
        top: 10px;
        left: 10px;
        animation: wifi-pulse 2s infinite 1s;
      }
    }
    
    &.disconnected .wifi-circle {
      border-color: #f56c6c;
      animation: wifi-error 1s infinite;
    }
  }
}

.error-info {
  .error-title {
    font-size: 24px;
    color: #303133;
    margin-bottom: 16px;
    font-weight: 600;
  }
  
  .error-message {
    font-size: 16px;
    color: #606266;
    line-height: 1.6;
    margin-bottom: 24px;
  }
  
  .connection-status {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
    
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .status-label {
        color: #666;
        font-size: 14px;
      }
      
      .status-value {
        font-weight: 500;
        font-size: 14px;
        
        &.status-online {
          color: #67c23a;
        }
        
        &.status-offline {
          color: #f56c6c;
        }
      }
    }
  }
  
  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  
  .troubleshooting {
    text-align: left;
    
    .troubleshooting-content {
      .troubleshooting-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        i {
          color: #409eff;
          margin-right: 8px;
          font-size: 12px;
        }
      }
    }
  }
}

@keyframes wifi-pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
}

@keyframes wifi-error {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

// 响应式适配
@media (max-width: 768px) {
  .network-error {
    padding: 20px 16px;
  }
  
  .error-content {
    .error-animation .wifi-symbol {
      width: 60px;
      height: 60px;
      
      .wifi-circle {
        &:nth-child(1) {
          width: 15px;
          height: 15px;
          top: 22px;
          left: 22px;
        }
        
        &:nth-child(2) {
          width: 30px;
          height: 30px;
          top: 15px;
          left: 15px;
        }
        
        &:nth-child(3) {
          width: 45px;
          height: 45px;
          top: 7px;
          left: 7px;
        }
      }
    }
    
    .error-info {
      .error-title {
        font-size: 20px;
      }
      
      .error-message {
        font-size: 14px;
      }
      
      .error-actions {
        flex-direction: column;
        align-items: center;
        
        .el-button {
          width: 100%;
          max-width: 200px;
        }
      }
    }
  }
}
</style>
