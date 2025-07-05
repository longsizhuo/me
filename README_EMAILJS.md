# EmailJS 集成说明

## 快速开始

### 1. 配置 EmailJS
1. 访问 [EmailJS官网](https://www.emailjs.com/) 注册账户
2. 创建 Email Service（连接你的邮箱）
3. 创建 Email Template（邮件模板）
4. 获取 API Keys

### 2. 设置环境变量
在项目根目录创建 `.env` 文件：

```env
VITE_EMAILJS_SERVICE_ID=你的服务ID
VITE_EMAILJS_TEMPLATE_ID=你的模板ID
VITE_EMAILJS_PUBLIC_KEY=你的公钥
VITE_EMAILJS_TO_NAME=你的姓名
```

### 3. 邮件模板变量
在 EmailJS 模板中使用以下变量：
- `{{from_name}}` - 发送者姓名
- `{{from_email}}` - 发送者邮箱
- `{{message}}` - 消息内容
- `{{to_name}}` - 你的姓名
- `{{timestamp}}` - 发送时间

## 功能特性

✅ **双重保障**：同时发送邮件和保存到数据库
✅ **智能错误处理**：区分不同类型的错误
✅ **用户友好界面**：实时状态反馈
✅ **表单验证**：前端验证确保数据质量
✅ **加载状态**：优雅的加载动画
✅ **详细日志**：控制台记录详细信息

## 使用方式

项目现在使用 `ContactAdvanced` 组件，提供：
- 更好的错误处理
- 实时状态显示
- 表单验证
- 加载动画

如需切换回原版本，在 `App.jsx` 中将 `ContactAdvanced` 改回 `Contact`。

## 测试

1. 启动项目：`npm run dev`
2. 访问联系表单
3. 填写并提交表单
4. 检查邮件和数据库记录 