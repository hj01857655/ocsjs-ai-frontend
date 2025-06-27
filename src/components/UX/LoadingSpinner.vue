<template>
  <div class="loading-spinner" :class="{ 'full-screen': fullScreen }">
    <div class="spinner-container">
      <div class="spinner" :class="spinnerType">
        <div v-if="spinnerType === 'dots'" class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <div v-else-if="spinnerType === 'circle'" class="circle"></div>
        <div v-else-if="spinnerType === 'pulse'" class="pulse"></div>
      </div>
      <div v-if="text" class="loading-text">{{ text }}</div>
      <div v-if="progress !== null" class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        <span class="progress-text">{{ Math.round(progress) }}%</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    fullScreen: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: '加载中...'
    },
    spinnerType: {
      type: String,
      default: 'circle',
      validator: value => ['dots', 'circle', 'pulse'].includes(value)
    },
    progress: {
      type: Number,
      default: null
    }
  }
}
</script>

<style lang="scss" scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  &.full-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  }
}

.spinner-container {
  text-align: center;
}

.spinner {
  margin-bottom: 15px;

  &.dots {
    .dots {
      display: flex;
      gap: 8px;
      justify-content: center;

      .dot {
        width: 12px;
        height: 12px;
        background: #409eff;
        border-radius: 50%;
        animation: dot-bounce 1.4s ease-in-out infinite both;

        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
        &:nth-child(3) { animation-delay: 0s; }
      }
    }
  }

  &.circle {
    .circle {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #409eff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
  }

  &.pulse {
    .pulse {
      width: 40px;
      height: 40px;
      background: #409eff;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
      margin: 0 auto;
    }
  }
}

.loading-text {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  margin: 0 auto;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #409eff, #67c23a);
    transition: width 0.3s ease;
  }

  .progress-text {
    position: absolute;
    top: -20px;
    right: 0;
    font-size: 12px;
    color: #666;
  }
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .loading-spinner {
    padding: 15px;
  }

  .spinner {
    &.circle .circle,
    &.pulse .pulse {
      width: 30px;
      height: 30px;
    }

    &.dots .dots .dot {
      width: 10px;
      height: 10px;
    }
  }

  .loading-text {
    font-size: 13px;
  }

  .progress-bar {
    width: 150px;
  }
}
</style>
