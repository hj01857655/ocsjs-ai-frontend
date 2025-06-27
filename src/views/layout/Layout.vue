<template>
  <div class="app-wrapper" :class="classObj">
    <!-- 移动端遮罩 -->
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />

    <!-- 侧边栏 -->
    <sidebar class="sidebar-container" />

    <!-- 主内容区域 -->
    <div class="main-container" :class="{ hasTagsView: needTagsView }">
      <!-- 顶部导航栏 -->
      <div class="fixed-header">
        <navbar />
        <tags-view v-if="needTagsView" />
      </div>

      <!-- 页面内容 -->
      <app-main />

      <!-- 右侧设置面板 -->
      <right-panel v-if="showSettings">
        <div class="settings-placeholder">
          <p>设置面板</p>
        </div>
      </right-panel>
    </div>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Sidebar from './components/Sidebar/index.vue'
import Navbar from './components/Navbar.vue'
import AppMain from './components/AppMain.vue'
import TagsView from './components/TagsView/index.vue'
import RightPanel from '@/components/RightPanel/index.vue'

const route = useRoute()
const appStore = useAppStore()

// 计算属性
const sidebar = computed(() => appStore.sidebar)
const device = computed(() => appStore.device)
const needTagsView = computed(() => true) // 可以根据配置决定是否显示标签页
const showSettings = computed(() => false) // 可以根据配置决定是否显示设置面板

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}))

// 方法
const handleClickOutside = () => {
  appStore.closeSidebar(false)
}

// 监听路由变化，移动端自动收起侧边栏
watchEffect(() => {
  if (device.value === 'mobile' && sidebar.value.opened) {
    appStore.closeSidebar(false)
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/mixin.scss';
@import '@/styles/variables.scss';

.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$sideBarWidth});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.mobile .fixed-header {
  width: 100%;
}
</style>
