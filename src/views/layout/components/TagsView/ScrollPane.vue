<template>
  <div
    ref="scrollContainer"
    class="scroll-container"
  >
    <div
      ref="scrollWrapper"
      class="scroll-wrapper"
      :style="{ transform: `translateX(${left}px)` }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['scroll'])

// 响应式数据
const scrollContainer = ref(null)
const scrollWrapper = ref(null)
const left = ref(0)

// 方法
const handleScroll = (e) => {
  // 检查是否需要阻止默认行为
  const $scrollWrapper = scrollWrapper.value
  const $scrollContainer = scrollContainer.value

  if (!$scrollWrapper || !$scrollContainer) {
    return
  }

  const wrapperWidth = $scrollWrapper.offsetWidth
  const containerWidth = $scrollContainer.offsetWidth

  // 如果内容宽度小于容器宽度，不需要滚动
  if (wrapperWidth <= containerWidth) {
    return
  }

  // 只有在需要滚动时才阻止默认行为
  e.preventDefault()

  const eventDelta = e.wheelDelta || -e.deltaY * 40

  if (eventDelta > 0) {
    left.value = Math.min(0, left.value + eventDelta)
  } else {
    if (containerWidth - wrapperWidth < left.value) {
      left.value = left.value
    } else {
      left.value = Math.max(containerWidth - wrapperWidth, left.value + eventDelta)
    }
  }

  emit('scroll')
}

const moveToTarget = (currentTag) => {
  const $scrollContainer = scrollContainer.value
  const $scrollWrapper = scrollWrapper.value

  if (!$scrollContainer || !$scrollWrapper || !currentTag) {
    return
  }

  const containerWidth = $scrollContainer.offsetWidth
  const wrapperWidth = $scrollWrapper.offsetWidth

  if (wrapperWidth < containerWidth) {
    left.value = 0
    return
  }

  // 正确获取标签元素的位置信息
  let tagOffsetLeft = 0
  let tagWidth = 0

  // 获取标签的 DOM 元素 - currentTag 是 Vue 组件实例
  const tagElement = currentTag.$el
  if (tagElement) {
    tagOffsetLeft = tagElement.offsetLeft || 0
    tagWidth = tagElement.offsetWidth || 0
  }

  if (tagOffsetLeft < -left.value) {
    // 标签在可视区域左侧
    left.value = -tagOffsetLeft + 20
  } else if (tagOffsetLeft + tagWidth > -left.value + containerWidth) {
    // 标签在可视区域右侧
    left.value = -(tagOffsetLeft - containerWidth + tagWidth + 20)
  }
}

// 暴露方法和元素给父组件
defineExpose({
  moveToTarget,
  // 直接暴露根 DOM 元素，避免 $el 访问
  $el: scrollContainer
})

// 生命周期
onMounted(() => {
  // 添加 passive 滚轮事件监听器
  const container = scrollContainer.value
  if (container) {
    // 使用 passive 选项来提高性能
    container.addEventListener('wheel', handleScroll, { passive: false })
    container.addEventListener('mousewheel', handleScroll, { passive: false })
  }
})

onBeforeUnmount(() => {
  // 清理事件监听器
  const container = scrollContainer.value
  if (container) {
    container.removeEventListener('wheel', handleScroll)
    container.removeEventListener('mousewheel', handleScroll)
  }
})
</script>

<style lang="scss" scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;

  .scroll-wrapper {
    position: absolute;
    transition: transform 0.3s ease-in-out;
  }
}
</style>
