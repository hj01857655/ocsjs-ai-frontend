<template>
  <div ref="rightPanel" :class="{ show: show }" class="rightPanel-container">
    <div class="rightPanel-background" />
    <div class="rightPanel">
      <div class="rightPanel-items">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  clickNotClose: {
    default: false,
    type: Boolean
  },
  buttonTop: {
    default: 250,
    type: Number
  }
})

// 响应式数据
const show = ref(false)
const rightPanel = ref(null)

// 方法
const addEventClick = () => {
  window.addEventListener('click', closeSidebar)
}

const closeSidebar = (evt) => {
  const parent = evt.target.closest('.rightPanel')
  if (!parent) {
    show.value = false
    window.removeEventListener('click', closeSidebar)
  }
}

const insertToBody = () => {
  const elx = rightPanel.value
  const body = document.querySelector('body')
  body.insertBefore(elx, body.firstChild)
}

// 监听器
watch(show, (value) => {
  if (value && !props.clickNotClose) {
    addEventClick()
  }
  if (value) {
    document.body.classList.add('showRightPanel')
  } else {
    document.body.classList.remove('showRightPanel')
  }
})

// 暴露方法
defineExpose({
  show: () => {
    show.value = true
  },
  hide: () => {
    show.value = false
  }
})
</script>

<style>
.showRightPanel {
  overflow: hidden;
  position: relative;
  width: calc(100% - 15px);
}
</style>

<style lang="scss" scoped>
.rightPanel-background {
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
  background: rgba(0, 0, 0, 0.2);
  z-index: -1;
}

.rightPanel {
  width: 100%;
  max-width: 260px;
  height: 100vh;
  position: fixed;
  top: 0;
  right: 0;
  box-shadow: 0px 0px 15px 0px rgba(0, 0, 0, 0.05);
  transition: all 0.25s cubic-bezier(0.7, 0.3, 0.1, 1);
  transform: translate(100%);
  background: #fff;
  z-index: 40000;
}

.show {
  transition: all 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);

  .rightPanel-background {
    z-index: 20000;
    opacity: 1;
    width: 100%;
    height: 100%;
  }

  .rightPanel {
    transform: translate(0);
  }
}

.rightPanel-items {
  padding: 20px;
}
</style>
