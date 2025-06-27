<template>
  <div v-if="!item.meta || !item.meta.hidden">
    <!-- 单个菜单项 -->
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.meta?.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
          <el-icon v-if="onlyOneChild.meta.icon">
            <component :is="onlyOneChild.meta.icon" />
          </el-icon>
          <template #title>
            <span>{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <!-- 子菜单 -->
    <el-sub-menu v-else ref="subMenu" :index="resolvePath(item.path)" teleported>
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>

      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="''"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { isExternal } from '@/utils/validate'
import AppLink from './Link.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isNest: {
    type: Boolean,
    default: false
  },
  basePath: {
    type: String,
    default: ''
  }
})

const onlyOneChild = ref({})

const hasOneShowingChild = (children = [], parent) => {
  if (!children || children.length === 0) {
    // 如果没有子路由，显示父路由本身
    onlyOneChild.value = { ...parent, path: parent.path, noShowingChildren: true }
    return true
  }

  const showingChildren = children.filter(item => {
    if (item.meta && item.meta.hidden) {
      return false
    } else {
      // 临时设置（用于判断）
      onlyOneChild.value = item
      return true
    }
  })

  // 当只有一个子路由时，默认显示子路由
  if (showingChildren.length === 1) {
    return true
  }

  // 如果没有可显示的子路由，显示父路由
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: parent.path, noShowingChildren: true }
    return true
  }

  return false
}

const resolvePath = (routePath) => {
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }

  // 如果 routePath 已经是完整路径（以 / 开头），直接返回
  if (routePath && routePath.startsWith('/')) {
    return routePath
  }

  return path.resolve(props.basePath, routePath)
}

// 路径解析工具
const path = {
  resolve(...paths) {
    let resolvedPath = ''
    let resolvedAbsolute = false

    for (let i = paths.length - 1; i >= 0 && !resolvedAbsolute; i--) {
      const path = paths[i]
      if (path && path !== '') {
        resolvedPath = path + '/' + resolvedPath
        resolvedAbsolute = path[0] === '/'
      }
    }

    if (!resolvedAbsolute) {
      resolvedPath = '/' + resolvedPath
    }

    return resolvedPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }
}
</script>

<style lang="scss" scoped>
.nest-menu :deep(.el-sub-menu__title),
.el-menu-item {
  &:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
}

.submenu-title-noDropdown {
  &:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
}
</style>
