<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-container">
      <div class="error-content">
        <div class="error-icon">
          <i class="el-icon-warning-outline"></i>
        </div>
        <div class="error-info">
          <h3 class="error-title">{{ errorTitle }}</h3>
          <p class="error-message">{{ errorMessage }}</p>
          <div v-if="showDetails && errorDetails" class="error-details">
            <el-collapse>
              <el-collapse-item title="错误详情" name="details">
                <pre class="error-stack">{{ errorDetails }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
          <div class="error-actions">
            <el-button @click="retry" type="primary" icon="el-icon-refresh">
              重试
            </el-button>
            <el-button @click="goHome" icon="el-icon-house">
              返回首页
            </el-button>
            <el-button @click="reportError" type="warning" icon="el-icon-warning">
              报告问题
            </el-button>
            <el-button v-if="!showDetails" @click="toggleDetails" type="info" plain>
              显示详情
            </el-button>
            <el-button v-else @click="toggleDetails" type="info" plain>
              隐藏详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script>
export default {
  name: 'ErrorBoundary',
  props: {
    fallbackTitle: {
      type: String,
      default: '页面出现错误'
    },
    fallbackMessage: {
      type: String,
      default: '抱歉，页面遇到了一些问题。请尝试刷新页面或联系技术支持。'
    },
    showRetry: {
      type: Boolean,
      default: true
    },
    showHome: {
      type: Boolean,
      default: true
    },
    showReport: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  },
  computed: {
    errorTitle() {
      if (this.error && this.error.name) {
        return `${this.error.name}: ${this.fallbackTitle}`
      }
      return this.fallbackTitle
    },
    errorMessage() {
      if (this.error && this.error.message) {
        return this.error.message
      }
      return this.fallbackMessage
    },
    errorDetails() {
      if (this.error) {
        let details = ''
        if (this.error.stack) {
          details += `堆栈跟踪:\n${this.error.stack}\n\n`
        }
        if (this.errorInfo) {
          details += `组件信息:\n${this.errorInfo}\n\n`
        }
        details += `时间: ${new Date().toLocaleString()}\n`
        details += `用户代理: ${navigator.userAgent}\n`
        details += `页面URL: ${window.location.href}`
        return details
      }
      return null
    }
  },
  errorCaptured(error, instance, errorInfo) {
    this.hasError = true
    this.error = error
    this.errorInfo = errorInfo
    
    // 记录错误到控制台
    console.error('ErrorBoundary captured an error:', error)
    console.error('Error info:', errorInfo)
    
    // 发送错误报告到后端
    this.logErrorToBackend(error, errorInfo)
    
    // 阻止错误继续传播
    return false
  },
  methods: {
    retry() {
      this.hasError = false
      this.error = null
      this.errorInfo = null
      this.showDetails = false
      
      // 触发重试事件
      this.$emit('retry')
      
      // 如果没有监听重试事件，则刷新页面
      this.$nextTick(() => {
        if (this.$listeners && !this.$listeners.retry) {
          window.location.reload()
        }
      })
    },
    goHome() {
      this.$router.push('/')
    },
    reportError() {
      // 构建错误报告
      const errorReport = {
        title: this.errorTitle,
        message: this.errorMessage,
        details: this.errorDetails,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
      
      // 这里可以集成错误报告系统
      // 暂时使用邮件链接
      const subject = encodeURIComponent(`错误报告: ${this.errorTitle}`)
      const body = encodeURIComponent(`错误详情:\n\n${JSON.stringify(errorReport, null, 2)}`)
      const mailtoLink = `mailto:support@example.com?subject=${subject}&body=${body}`
      
      window.open(mailtoLink)
    },
    toggleDetails() {
      this.showDetails = !this.showDetails
    },
    async logErrorToBackend(error, errorInfo) {
      try {
        // 发送错误日志到后端
        await fetch('/api/logs/error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            level: 'error',
            source: 'frontend',
            message: `Frontend Error: ${error.message}`,
            context: {
              error_name: error.name,
              error_message: error.message,
              error_stack: error.stack,
              component_info: errorInfo,
              url: window.location.href,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (logError) {
        console.error('Failed to log error to backend:', logError)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.error-content {
  max-width: 600px;
  text-align: center;
  
  .error-icon {
    font-size: 64px;
    color: #f56c6c;
    margin-bottom: 24px;
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
    
    .error-details {
      margin-bottom: 24px;
      text-align: left;
      
      .error-stack {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: #666;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 300px;
        overflow-y: auto;
      }
    }
    
    .error-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .error-container {
    padding: 20px 16px;
    min-height: 300px;
  }
  
  .error-content {
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .error-info {
      .error-title {
        font-size: 20px;
        margin-bottom: 12px;
      }
      
      .error-message {
        font-size: 14px;
        margin-bottom: 20px;
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

@media (max-width: 480px) {
  .error-container {
    padding: 16px 12px;
  }
  
  .error-content {
    .error-icon {
      font-size: 40px;
    }
    
    .error-info {
      .error-title {
        font-size: 18px;
      }
      
      .error-message {
        font-size: 13px;
      }
      
      .error-details .error-stack {
        font-size: 11px;
        padding: 12px;
      }
    }
  }
}
</style>
