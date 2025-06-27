<template>
  <div class="action-feedback">
    <!-- 按钮加载状态 -->
    <el-button
      v-if="type === 'button'"
      :type="buttonType"
      :size="size"
      :loading="loading"
      :disabled="disabled"
      @click="handleClick"
      class="feedback-button"
    >
      <i v-if="!loading && icon" :class="icon" class="button-icon"></i>
      <span>{{ loading ? loadingText : text }}</span>
    </el-button>

    <!-- 操作状态指示器 -->
    <div v-else-if="type === 'status'" class="status-indicator" :class="statusClass">
      <div class="status-icon">
        <i :class="statusIcon"></i>
      </div>
      <div class="status-content">
        <div class="status-text">{{ statusText }}</div>
        <div v-if="statusDetail" class="status-detail">{{ statusDetail }}</div>
      </div>
      <div v-if="showProgress && progress !== null" class="status-progress">
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="6"
          :show-text="false"
        ></el-progress>
      </div>
    </div>

    <!-- 操作结果卡片 -->
    <div v-else-if="type === 'result'" class="result-card" :class="resultClass">
      <div class="result-header">
        <div class="result-icon">
          <i :class="resultIcon"></i>
        </div>
        <div class="result-title">{{ resultTitle }}</div>
      </div>
      <div class="result-content">
        <div class="result-message">{{ resultMessage }}</div>
        <div v-if="resultDetail" class="result-detail">{{ resultDetail }}</div>
        <div v-if="resultActions.length > 0" class="result-actions">
          <el-button
            v-for="action in resultActions"
            :key="action.key"
            :type="action.type || 'default'"
            :size="action.size || 'small'"
            @click="handleActionClick(action)"
          >
            {{ action.text }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 浮动操作按钮 -->
    <div v-else-if="type === 'fab'" class="fab-container" :class="{ 'fab-expanded': fabExpanded }">
      <div class="fab-main" @click="toggleFab">
        <i :class="fabIcon"></i>
      </div>
      <div v-if="fabActions.length > 0" class="fab-actions">
        <div
          v-for="(action, index) in fabActions"
          :key="action.key"
          class="fab-action"
          :style="{ transitionDelay: `${index * 50}ms` }"
          @click="handleFabAction(action)"
        >
          <i :class="action.icon"></i>
          <span class="fab-tooltip">{{ action.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActionFeedback',
  props: {
    type: {
      type: String,
      default: 'button',
      validator: value => ['button', 'status', 'result', 'fab'].includes(value)
    },
    // 按钮相关
    text: {
      type: String,
      default: '确定'
    },
    loadingText: {
      type: String,
      default: '处理中...'
    },
    buttonType: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: 'default'
    },
    icon: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // 状态相关
    status: {
      type: String,
      default: 'idle',
      validator: value => ['idle', 'loading', 'success', 'error', 'warning'].includes(value)
    },
    statusText: {
      type: String,
      default: ''
    },
    statusDetail: {
      type: String,
      default: ''
    },
    showProgress: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: null
    },
    // 结果相关
    result: {
      type: String,
      default: 'success',
      validator: value => ['success', 'error', 'warning', 'info'].includes(value)
    },
    resultTitle: {
      type: String,
      default: ''
    },
    resultMessage: {
      type: String,
      default: ''
    },
    resultDetail: {
      type: String,
      default: ''
    },
    resultActions: {
      type: Array,
      default: () => []
    },
    // FAB相关
    fabIcon: {
      type: String,
      default: 'el-icon-plus'
    },
    fabActions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      fabExpanded: false
    }
  },
  computed: {
    statusClass() {
      return `status-${this.status}`
    },
    statusIcon() {
      const iconMap = {
        idle: 'el-icon-info',
        loading: 'el-icon-loading',
        success: 'el-icon-success',
        error: 'el-icon-error',
        warning: 'el-icon-warning'
      }
      return iconMap[this.status]
    },
    progressStatus() {
      const statusMap = {
        success: 'success',
        error: 'exception',
        warning: 'warning'
      }
      return statusMap[this.status] || null
    },
    resultClass() {
      return `result-${this.result}`
    },
    resultIcon() {
      const iconMap = {
        success: 'el-icon-success',
        error: 'el-icon-error',
        warning: 'el-icon-warning',
        info: 'el-icon-info'
      }
      return iconMap[this.result]
    }
  },
  methods: {
    handleClick() {
      this.$emit('click')
    },
    handleActionClick(action) {
      this.$emit('action', action)
    },
    toggleFab() {
      this.fabExpanded = !this.fabExpanded
    },
    handleFabAction(action) {
      this.fabExpanded = false
      this.$emit('fab-action', action)
    }
  }
}
</script>

<style lang="scss" scoped>
.action-feedback {
  .feedback-button {
    .button-icon {
      margin-right: 6px;
    }
  }

  .status-indicator {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 6px;
    background: #f8f9fa;

    &.status-loading {
      background: #e6f7ff;
      border: 1px solid #91d5ff;
    }

    &.status-success {
      background: #f6ffed;
      border: 1px solid #b7eb8f;
    }

    &.status-error {
      background: #fff2f0;
      border: 1px solid #ffccc7;
    }

    &.status-warning {
      background: #fffbe6;
      border: 1px solid #ffe58f;
    }

    .status-icon {
      margin-right: 12px;
      font-size: 18px;

      .status-loading & i {
        color: #1890ff;
      }

      .status-success & i {
        color: #52c41a;
      }

      .status-error & i {
        color: #ff4d4f;
      }

      .status-warning & i {
        color: #faad14;
      }
    }

    .status-content {
      flex: 1;
    }

    .status-text {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .status-detail {
      font-size: 12px;
      color: #666;
    }

    .status-progress {
      margin-left: 12px;
      width: 100px;
    }
  }

  .result-card {
    border-radius: 8px;
    padding: 20px;
    border: 1px solid;

    &.result-success {
      background: #f6ffed;
      border-color: #b7eb8f;
    }

    &.result-error {
      background: #fff2f0;
      border-color: #ffccc7;
    }

    &.result-warning {
      background: #fffbe6;
      border-color: #ffe58f;
    }

    &.result-info {
      background: #e6f7ff;
      border-color: #91d5ff;
    }

    .result-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .result-icon {
        margin-right: 12px;
        font-size: 24px;

        .result-success & i { color: #52c41a; }
        .result-error & i { color: #ff4d4f; }
        .result-warning & i { color: #faad14; }
        .result-info & i { color: #1890ff; }
      }

      .result-title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .result-message {
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .result-detail {
      font-size: 12px;
      color: #666;
      margin-bottom: 16px;
    }

    .result-actions {
      display: flex;
      gap: 8px;
    }
  }

  .fab-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;

    .fab-main {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #409eff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(64, 158, 255, 0.6);
      }

      i {
        font-size: 24px;
      }
    }

    .fab-actions {
      position: absolute;
      bottom: 70px;
      right: 0;

      .fab-action {
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: white;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        transform: scale(0);
        opacity: 0;

        .fab-expanded & {
          transform: scale(1);
          opacity: 1;
        }

        &:hover {
          background: #409eff;
          color: white;

          .fab-tooltip {
            opacity: 1;
            transform: translateX(-100%);
          }
        }

        .fab-tooltip {
          position: absolute;
          right: 60px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: none;
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .action-feedback {
    .status-indicator {
      padding: 10px;

      .status-icon {
        margin-right: 8px;
        font-size: 16px;
      }

      .status-progress {
        width: 80px;
      }
    }

    .result-card {
      padding: 16px;

      .result-header .result-icon {
        font-size: 20px;
        margin-right: 8px;
      }

      .result-actions {
        flex-direction: column;
        gap: 6px;
      }
    }

    .fab-container {
      bottom: 16px;
      right: 16px;

      .fab-main {
        width: 48px;
        height: 48px;

        i {
          font-size: 20px;
        }
      }

      .fab-actions .fab-action {
        width: 40px;
        height: 40px;
        margin-bottom: 8px;
      }
    }
  }
}
</style>
