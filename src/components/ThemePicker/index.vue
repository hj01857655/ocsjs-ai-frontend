<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="theme-picker-trigger" title="主题设置">
      <el-icon class="theme-picker">
        <Sunny v-if="currentTheme === 'light'" />
        <Moon v-else />
      </el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="light">
          <el-icon><Sunny /></el-icon>
          浅色主题
        </el-dropdown-item>
        <el-dropdown-item command="dark">
          <el-icon><Moon /></el-icon>
          深色主题
        </el-dropdown-item>
        <el-dropdown-item command="auto">
          <el-icon><Monitor /></el-icon>
          跟随系统
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { Sunny, Moon, Monitor } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// 计算属性
const currentTheme = computed(() => appStore.theme)

// 方法
const handleCommand = (theme) => {
  appStore.setTheme(theme)
}
</script>

<style lang="scss" scoped>
.theme-picker-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: var(--el-color-primary);
  }
}

.theme-picker {
  font-size: 20px;
  transition: color 0.3s;
}
</style>
