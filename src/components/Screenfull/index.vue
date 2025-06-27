<template>
  <div @click="click">
    <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'" placement="bottom">
      <el-icon class="screenfull-icon">
        <FullScreen v-if="!isFullscreen" />
        <Aim v-else />
      </el-icon>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { FullScreen, Aim } from '@element-plus/icons-vue'
import screenfull from 'screenfull'

// 响应式数据
const isFullscreen = ref(false)

// 方法
const click = () => {
  if (!screenfull.isEnabled) {
    ElMessage.warning('您的浏览器不支持全屏功能')
    return false
  }
  screenfull.toggle()
}

const change = () => {
  isFullscreen.value = screenfull.isFullscreen
}

const init = () => {
  if (screenfull.isEnabled) {
    screenfull.on('change', change)
  }
}

const destroy = () => {
  if (screenfull.isEnabled) {
    screenfull.off('change', change)
  }
}

// 生命周期
onMounted(() => {
  init()
})

onUnmounted(() => {
  destroy()
})
</script>

<style lang="scss" scoped>
.screenfull-icon {
  cursor: pointer;
  font-size: 20px;
  
  &:hover {
    color: var(--el-color-primary);
  }
}
</style>
