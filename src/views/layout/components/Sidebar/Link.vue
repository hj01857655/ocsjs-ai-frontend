<template>
  <!-- 外部链接 -->
  <a v-if="isExternal(to)" :href="to" target="_blank" rel="noopener">
    <slot />
  </a>
  <!-- 内部路由链接 -->
  <router-link v-else :to="to">
    <slot />
  </router-link>
</template>

<script setup>
import { isExternal } from '@/utils/validate'

defineProps({
  to: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
:deep(a) {
  color: inherit;
  text-decoration: none;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
