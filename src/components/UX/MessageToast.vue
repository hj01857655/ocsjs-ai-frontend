<template>
  <transition name="toast-fade">
    <div v-if="visible" class="message-toast" :class="[`toast-${type}`, { 'toast-closable': closable }]">
      <div class="toast-icon">
        <i :class="iconClass"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title" v-if="title">{{ title }}</div>
        <div class="toast-message">{{ message }}</div>
        <div v-if="details" class="toast-details">{{ details }}</div>
      </div>
      <div v-if="closable" class="toast-close" @click="close">
        <i class="el-icon-close"></i>
      </div>
      <div v-if="showProgress" class="toast-progress">
        <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'MessageToast',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: value => ['success', 'warning', 'error', 'info'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    details: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 3000
    },
    closable: {
      type: Boolean,
      default: true
    },
    showProgress: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: false,
      progressWidth: 100,
      timer: null,
      progressTimer: null
    }
  },
  computed: {
    iconClass() {
      const iconMap = {
        success: 'el-icon-success',
        warning: 'el-icon-warning',
        error: 'el-icon-error',
        info: 'el-icon-info'
      }
      return iconMap[this.type]
    }
  },
  mounted() {
    this.show()
  },
  beforeDestroy() {
    this.clearTimers()
  },
  methods: {
    show() {
      this.visible = true
      
      if (this.duration > 0) {
        this.startAutoClose()
      }
    },
    close() {
      this.visible = false
      this.clearTimers()
      this.$emit('close')
    },
    startAutoClose() {
      if (this.showProgress) {
        this.startProgress()
      }
      
      this.timer = setTimeout(() => {
        this.close()
      }, this.duration)
    },
    startProgress() {
      const interval = 50
      const step = (interval / this.duration) * 100
      
      this.progressTimer = setInterval(() => {
        this.progressWidth -= step
        if (this.progressWidth <= 0) {
          this.progressWidth = 0
          clearInterval(this.progressTimer)
        }
      }, interval)
    },
    clearTimers() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
    },
    pauseAutoClose() {
      this.clearTimers()
    },
    resumeAutoClose() {
      if (this.duration > 0 && this.visible) {
        const remainingTime = (this.progressWidth / 100) * this.duration
        this.timer = setTimeout(() => {
          this.close()
        }, remainingTime)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.message-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #fff;
  border-left: 4px solid;
  min-width: 300px;
  max-width: 500px;
  overflow: hidden;

  &.toast-success {
    border-left-color: #67c23a;
    .toast-icon i {
      color: #67c23a;
    }
  }

  &.toast-warning {
    border-left-color: #e6a23c;
    .toast-icon i {
      color: #e6a23c;
    }
  }

  &.toast-error {
    border-left-color: #f56c6c;
    .toast-icon i {
      color: #f56c6c;
    }
  }

  &.toast-info {
    border-left-color: #409eff;
    .toast-icon i {
      color: #409eff;
    }
  }

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

.toast-icon {
  margin-right: 12px;
  margin-top: 2px;

  i {
    font-size: 18px;
  }
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
}

.toast-message {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  word-break: break-word;
}

.toast-details {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.toast-close {
  margin-left: 12px;
  cursor: pointer;
  color: #c0c4cc;
  transition: color 0.2s;

  &:hover {
    color: #909399;
  }

  i {
    font-size: 14px;
  }
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.1);

  .progress-bar {
    height: 100%;
    background: currentColor;
    transition: width 0.1s linear;
  }
}

// 动画效果
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter {
  opacity: 0;
  transform: translateX(100%);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// 响应式适配
@media (max-width: 768px) {
  .message-toast {
    min-width: 280px;
    max-width: calc(100vw - 32px);
    padding: 12px;
    margin-bottom: 8px;
  }

  .toast-icon {
    margin-right: 8px;

    i {
      font-size: 16px;
    }
  }

  .toast-title {
    font-size: 15px;
  }

  .toast-message {
    font-size: 13px;
  }

  .toast-details {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .message-toast {
    min-width: 260px;
    padding: 10px;
  }

  .toast-title {
    font-size: 14px;
  }

  .toast-message {
    font-size: 12px;
  }
}
</style>
