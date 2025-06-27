# OCSJS AI - 智能题库系统前端

这是OCSJS AI智能题库系统的前端项目，基于Vue 3 + Element Plus构建的现代化Web管理界面。

## 🌟 功能特点

- 🎨 **现代化UI**：基于Element Plus的美观界面设计
- 📱 **响应式设计**：完美适配桌面、平板和手机设备
- 🔍 **智能搜索**：AI驱动的题目搜索和答案生成
- 📊 **数据可视化**：丰富的图表和统计信息展示
- 👥 **用户管理**：完整的用户注册、登录、权限管理
- 🔧 **系统管理**：代理池管理、系统监控、日志查看
- 📚 **题库管理**：题目增删改查、批量导入导出
- 🌐 **国际化**：支持多语言切换
- 🎯 **实时监控**：网络状态、系统健康度实时监控
- ⚡ **性能优化**：懒加载、缓存、防抖等优化策略

## 📋 技术栈

- **框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 5+
- **UI组件库**: Element Plus 2.4+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **HTTP客户端**: Axios 1.6+
- **图表库**: ECharts 5+
- **样式**: SCSS + CSS Variables

## 🚀 快速开始

### 1. 环境要求

- Node.js 16+ (推荐 Node.js 18+)
- npm 8+ (或 yarn 1.22+)

### 2. 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install
```

### 3. 环境配置

复制并编辑环境配置文件：

```bash
# 开发环境
cp .env.example .env.development

# 生产环境
cp .env.example .env.production
```

编辑配置文件，设置后端API地址：

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:5000/api

# .env.production
VITE_API_BASE_URL=/api
```

### 4. 启动开发服务器

```bash
# 开发模式
npm run dev

# 或
yarn dev
```

访问 http://localhost:8080 查看应用。

### 5. 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📁 项目结构

```
frontend/
├── public/                    # 静态资源
│   ├── favicon.ico
│   └── logo.png
├── src/                       # 源代码
│   ├── api/                   # API接口封装
│   │   ├── auth.js           # 认证接口
│   │   ├── questions.js      # 题目接口
│   │   ├── users.js          # 用户接口
│   │   ├── health.js         # 健康检查接口
│   │   └── proxy.js          # 代理管理接口
│   ├── assets/                # 资源文件
│   │   ├── images/           # 图片资源
│   │   └── icons/            # 图标资源
│   ├── components/            # 组件
│   │   ├── Global/           # 全局组件
│   │   ├── UX/               # 用户体验组件
│   │   └── Charts/           # 图表组件
│   ├── router/                # 路由配置
│   │   └── index.js
│   ├── stores/                # 状态管理
│   │   ├── app.js            # 应用状态
│   │   ├── user.js           # 用户状态
│   │   └── index.js
│   ├── styles/                # 样式文件
│   │   ├── index.scss        # 主样式文件
│   │   ├── variables.scss    # 变量定义
│   │   └── responsive.scss   # 响应式样式
│   ├── utils/                 # 工具函数
│   │   ├── request.js        # HTTP请求封装
│   │   ├── auth.js           # 认证工具
│   │   ├── validate.js       # 验证工具
│   │   ├── health.js         # 健康检查工具
│   │   └── errorHandler.js   # 错误处理工具
│   ├── views/                 # 页面组件
│   │   ├── auth/             # 认证页面
│   │   ├── dashboard/        # 仪表盘
│   │   ├── search/           # 搜索页面
│   │   ├── admin/            # 管理页面
│   │   └── user/             # 用户页面
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
├── index.html                 # HTML模板
├── package.json              # 项目配置
├── vite.config.js            # Vite配置
├── FRONTEND_DEVELOPMENT_STANDARDS.md  # 开发规范
└── README.md                 # 项目文档
```

## 🔧 开发配置

### Vite配置

```javascript
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### 代理配置

开发环境下，前端通过Vite代理访问后端API，避免跨域问题。

## 🎨 主要功能模块

### 1. 用户认证
- 登录/注册界面
- JWT令牌管理
- 权限控制

### 2. 智能搜索
- AI题目搜索
- 实时答案生成
- 搜索历史管理

### 3. 系统管理
- 用户管理
- 代理池配置
- 系统监控
- 日志查看

### 4. 数据可视化
- 使用统计图表
- 系统性能监控
- 实时数据展示

## 📱 响应式设计

项目采用Element Plus的栅格系统，支持多种屏幕尺寸：

- **xs**: <768px (手机)
- **sm**: ≥768px (平板)
- **md**: ≥992px (小桌面)
- **lg**: ≥1200px (桌面)
- **xl**: ≥1920px (大屏)

## 🔧 开发规范

项目遵循严格的开发规范，详见 [FRONTEND_DEVELOPMENT_STANDARDS.md](./FRONTEND_DEVELOPMENT_STANDARDS.md)

### 主要规范

- 组件命名：PascalCase
- 变量命名：camelCase
- 文件命名：kebab-case
- 使用Composition API
- TypeScript类型检查
- ESLint代码检查

## 🚀 部署指南

### 静态部署

```bash
# 构建
npm run build

# 部署到Web服务器
cp -r dist/* /var/www/html/
```

### Docker部署

```bash
# 构建镜像
docker build -t edubrain-frontend .

# 运行容器
docker run -d -p 80:80 edubrain-frontend
```

### Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🧪 测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 代码覆盖率
npm run test:coverage
```

## 📊 性能优化

- 路由懒加载
- 组件按需导入
- 图片懒加载
- 防抖节流
- 缓存策略
- 代码分割

## 🤝 开发指南

### 添加新页面

1. 在 `src/views/` 创建页面组件
2. 在 `src/router/` 添加路由配置
3. 在导航菜单中添加链接

### 添加新API

1. 在 `src/api/` 创建API模块
2. 使用统一的request工具
3. 添加错误处理

### 添加新组件

1. 在 `src/components/` 创建组件
2. 遵循命名规范
3. 添加适当的文档

## 📄 许可证

本项目仅供学习和研究使用。

## 🔗 相关链接

- [后端项目](https://github.com/hj01857655/ocsjs-ai-backend)
- [Element Plus文档](https://element-plus.org/)
- [Vue 3文档](https://vuejs.org/)
- [Vite文档](https://vitejs.dev/)

---

**最后更新**: 2025-01-25
**版本**: v2.0.0
**维护者**: OCSJS AI Team
