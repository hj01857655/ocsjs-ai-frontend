<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-content">
        <!-- 404动画图标 -->
        <div class="error-icon">
          <div class="number">4</div>
          <div class="illustration">
            <div class="circle"></div>
            <div class="clip">
              <div class="paper">
                <div class="face">
                  <div class="eyes">
                    <div class="eye eye-left"></div>
                    <div class="eye eye-right"></div>
                  </div>
                  <div class="rosyCheeks rosyCheeks-left"></div>
                  <div class="rosyCheeks rosyCheeks-right"></div>
                  <div class="mouth"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="number">4</div>
        </div>

        <!-- 错误信息 -->
        <div class="error-info">
          <h1 class="error-title">页面不存在</h1>
          <p class="error-description">
            抱歉，您访问的页面不存在或已被移除。
            <br>
            请检查URL是否正确，或返回首页继续浏览。
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="error-actions">
          <el-button type="primary" size="large" @click="goHome">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
          <el-button size="large" @click="goBack">
            <el-icon><Back /></el-icon>
            返回上页
          </el-button>
          <el-button type="success" size="large" @click="goSearch">
            <el-icon><Search /></el-icon>
            搜索题目
          </el-button>
        </div>

        <!-- 建议链接 -->
        <div class="suggested-links">
          <h3>您可能想要访问：</h3>
          <div class="links-grid">
            <router-link to="/dashboard" class="link-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>仪表盘</span>
            </router-link>
            <router-link to="/search/ai" class="link-item">
              <el-icon><MagicStick /></el-icon>
              <span>AI搜题</span>
            </router-link>
            <router-link to="/questions/list" class="link-item">
              <el-icon><Collection /></el-icon>
              <span>题库管理</span>
            </router-link>
            <router-link to="/system/cache" class="link-item">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { 
  House, 
  Back, 
  Search, 
  DataAnalysis, 
  MagicStick, 
  Collection, 
  Setting 
} from '@element-plus/icons-vue'

const router = useRouter()

// 方法
const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}

const goSearch = () => {
  router.push('/search/ai')
}
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.error-container {
  max-width: 800px;
  width: 100%;
  padding: 40px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.error-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 60px 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

// 404动画图标
.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  
  .number {
    font-size: 120px;
    font-weight: 700;
    color: #667eea;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .illustration {
    margin: 0 20px;
    position: relative;
    
    .circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: #667eea;
      position: relative;
      animation: bounce 2s infinite;
    }
    
    .clip {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      
      .paper {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: #fff;
        position: absolute;
        top: 10px;
        left: 10px;
        
        .face {
          position: relative;
          width: 100%;
          height: 100%;
          
          .eyes {
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            
            .eye {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #333;
              display: inline-block;
              margin: 0 8px;
              animation: blink 3s infinite;
            }
          }
          
          .rosyCheeks {
            position: absolute;
            top: 45px;
            width: 12px;
            height: 8px;
            border-radius: 50%;
            background: #ff9999;
            
            &.rosyCheeks-left {
              left: 20px;
            }
            
            &.rosyCheeks-right {
              right: 20px;
            }
          }
          
          .mouth {
            position: absolute;
            top: 55px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 10px;
            border-radius: 0 0 20px 20px;
            background: #333;
          }
        }
      }
    }
  }
}

.error-info {
  margin-bottom: 40px;
  
  .error-title {
    font-size: 36px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 20px 0;
  }
  
  .error-description {
    font-size: 16px;
    color: #7f8c8d;
    line-height: 1.6;
    margin: 0;
  }
}

.error-actions {
  margin-bottom: 40px;
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.suggested-links {
  h3 {
    font-size: 18px;
    color: #2c3e50;
    margin: 0 0 20px 0;
  }
  
  .links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    
    .link-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      text-decoration: none;
      transition: all 0.3s;
      
      &:hover {
        background: rgba(102, 126, 234, 0.2);
        transform: translateY(-2px);
      }
      
      .el-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      span {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

// 背景装饰
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  
  .floating-shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
    
    &.shape-1 {
      width: 100px;
      height: 100px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }
    
    &.shape-2 {
      width: 150px;
      height: 150px;
      top: 20%;
      right: 10%;
      animation-delay: 2s;
    }
    
    &.shape-3 {
      width: 80px;
      height: 80px;
      bottom: 20%;
      left: 20%;
      animation-delay: 4s;
    }
    
    &.shape-4 {
      width: 120px;
      height: 120px;
      bottom: 10%;
      right: 20%;
      animation-delay: 1s;
    }
  }
}

// 动画
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes blink {
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .error-content {
    padding: 40px 20px;
  }
  
  .error-icon .number {
    font-size: 80px;
  }
  
  .error-icon .illustration {
    margin: 0 10px;
    
    .circle {
      width: 80px;
      height: 80px;
    }
    
    .clip {
      width: 80px;
      height: 80px;
    }
    
    .paper {
      width: 70px;
      height: 70px;
      top: 5px;
      left: 5px;
    }
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
    
    .el-button {
      width: 200px;
    }
  }
  
  .links-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
