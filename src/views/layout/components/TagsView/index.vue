<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPane" class="tags-view-wrapper" @scroll="handleScroll">
      <router-link
        v-for="tag in visitedViews"
        ref="tag"
        :key="tag.path"
        :class="isActive(tag) ? 'active' : ''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        tag="span"
        class="tags-view-item"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        {{ tag.title }}
        <el-icon
          v-if="!isAffix(tag)"
          class="el-icon-close"
          @click.prevent.stop="closeSelectedTag(tag)"
        >
          <Close />
        </el-icon>
      </router-link>
    </scroll-pane>
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">刷新</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">关闭</li>
      <li @click="closeOthersTags">关闭其它</li>
      <li @click="closeAllTags(selectedTag)">关闭所有</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import ScrollPane from './ScrollPane.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref({})
const affixTags = ref([])
const scrollPane = ref(null)
const tag = ref([])

// 计算属性
const visitedViews = computed(() => appStore.visitedViews || [])

// 方法
const isActive = (routeItem) => {
  return routeItem.path === route.path
}

const isAffix = (tag) => {
  return tag.meta && tag.meta.affix
}

const filterAffixTags = (routes, basePath = '/') => {
  let tags = []
  routes.forEach(route => {
    if (route.meta && route.meta.affix) {
      const tagPath = path.resolve(basePath, route.path)
      tags.push({
        fullPath: tagPath,
        path: tagPath,
        name: route.name,
        meta: { ...route.meta }
      })
    }
    if (route.children) {
      const tempTags = filterAffixTags(route.children, route.path)
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags]
      }
    }
  })
  return tags
}

const initTags = () => {
  const affixTagsValue = affixTags.value = filterAffixTags(router.getRoutes())
  for (const tag of affixTagsValue) {
    if (tag.name) {
      appStore.addVisitedView(tag)
    }
  }
}

const addTags = () => {
  const { name } = route
  if (name) {
    appStore.addView(route)
  }
  return false
}

const moveToCurrentTag = () => {
  const tags = tag.value
  nextTick(() => {
    for (const tag of tags) {
      if (tag.to.path === route.path) {
        scrollPane.value.moveToTarget(tag)
        if (tag.to.fullPath !== route.fullPath) {
          appStore.updateVisitedView(route)
        }
        break
      }
    }
  })
}

const refreshSelectedTag = (view) => {
  appStore.delCachedView(view).then(() => {
    const { fullPath } = view
    nextTick(() => {
      router.replace({
        path: '/redirect' + fullPath
      })
    })
  })
}

const closeSelectedTag = (view) => {
  appStore.delView(view).then(({ visitedViews }) => {
    if (isActive(view)) {
      toLastView(visitedViews, view)
    }
  })
}

const closeOthersTags = () => {
  router.push(selectedTag.value)
  appStore.delOthersViews(selectedTag.value).then(() => {
    moveToCurrentTag()
  })
}

const closeAllTags = (view) => {
  appStore.delAllViews().then(({ visitedViews }) => {
    if (affixTags.value.some(tag => tag.path === view.path)) {
      return
    }
    toLastView(visitedViews, view)
  })
}

const toLastView = (visitedViews, view) => {
  const latestView = visitedViews.slice(-1)[0]
  if (latestView) {
    router.push(latestView.fullPath)
  } else {
    if (view.name === 'Dashboard') {
      router.replace({ path: '/redirect/dashboard' })
    } else {
      router.push('/')
    }
  }
}

const openMenu = (tag, e) => {
  const menuMinWidth = 105

  // 获取滚动面板的边界矩形
  let offsetLeft = 0
  let offsetWidth = 0

  // 正确获取 ScrollPane 组件的 DOM 元素
  if (scrollPane.value) {
    // ScrollPane 是组件实例，需要获取其根 DOM 元素
    const scrollElement = scrollPane.value.$el
    if (scrollElement) {
      const rect = scrollElement.getBoundingClientRect()
      offsetLeft = rect.left
      offsetWidth = scrollElement.offsetWidth || 0
    }
  }

  const maxLeft = offsetWidth - menuMinWidth
  const leftValue = e.clientX - offsetLeft + 15

  if (leftValue > maxLeft) {
    left.value = maxLeft
  } else {
    left.value = leftValue
  }

  top.value = e.clientY
  visible.value = true
  selectedTag.value = tag
}

const closeMenu = () => {
  visible.value = false
}

const handleScroll = () => {
  closeMenu()
}

// 监听器
watch(route, () => {
  addTags()
  moveToCurrentTag()
})

watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu)
  } else {
    document.body.removeEventListener('click', closeMenu)
  }
})

// 生命周期
onMounted(() => {
  initTags()
  addTags()
})

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
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 26px;
      border: 1px solid #d8dce5;
      color: #495057;
      background: #fff;
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 4px;

      &:first-of-type {
        margin-left: 15px;
      }

      &:last-of-type {
        margin-right: 15px;
      }

      &.active {
        background-color: #42b983;
        color: #fff;
        border-color: #42b983;

        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);

    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;

      &:hover {
        background: #eee;
      }
    }
  }
}

.el-icon-close {
  width: 16px;
  height: 16px;
  vertical-align: 2px;
  border-radius: 50%;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  transform-origin: 100% 50%;

  &:before {
    transform: scale(0.6);
    display: inline-block;
    vertical-align: -3px;
  }

  &:hover {
    background-color: #b4bccc;
    color: #fff;
  }
}
</style>
