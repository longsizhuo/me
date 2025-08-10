# 开发环境配置指南

## 后端API配置

### 自动配置（推荐）

项目已经配置为在开发模式下自动连接到 `http://localhost:8181`，在生产模式下连接到 `https://me.longsizhuo.com`。

### 手动配置

如果你想使用不同的后端地址，可以在项目根目录创建 `.env.local` 文件：

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8181
```

## 当前配置状态

项目会自动检测环境并设置相应的API地址：

- **开发环境** (`npm run dev`): `http://localhost:8181`
- **生产环境** (`npm run build`): `https://me.longsizhuo.com`

## 已更新的组件

以下组件已经更新为使用新的API配置：

1. **VideoToAscii.jsx** - 视频转ASCII功能
2. **Contact.jsx** - 联系表单
3. **ContactAdvanced.jsx** - 高级联系表单

## 测试本地后端

1. 确保你的后端服务运行在 `localhost:8181`
2. 启动前端开发服务器：`npm run dev`
3. 测试相关功能是否正常连接到本地后端

## 故障排除

如果遇到连接问题：

1. 检查后端服务是否正在运行
2. 确认端口8181是否被占用
3. 检查浏览器控制台是否有CORS错误
4. 确保后端服务允许来自 `localhost:5173` 的请求

## 环境变量优先级

1. `VITE_API_BASE_URL` (如果设置)
2. 根据 `import.meta.env.DEV` 自动判断
3. 默认值
