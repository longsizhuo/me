# EmailJS 配置指南

## 概述
这个项目使用 EmailJS 来发送邮件通知，同时保持原有的数据库保存功能。当用户提交联系表单时，系统会：
1. 发送邮件通知给你
2. 将消息保存到数据库
3. 执行健康检查

## 配置步骤

### 1. 注册 EmailJS 账户
1. 访问 [EmailJS官网](https://www.emailjs.com/)
2. 注册一个免费账户
3. 验证你的邮箱地址

### 2. 创建 Email Service
1. 在 EmailJS 控制台中，点击 "Email Services"
2. 点击 "Add New Service"
3. 选择你的邮件服务提供商（如 Gmail、Outlook 等）
4. 按照提示连接你的邮箱账户
5. 记录下生成的 **Service ID**

### 3. 创建 Email Template
1. 在 EmailJS 控制台中，点击 "Email Templates"
2. 点击 "Create New Template"
3. 设计你的邮件模板，可以使用以下变量：
   - `{{from_name}}` - 发送者的姓名
   - `{{from_email}}` - 发送者的邮箱
   - `{{message}}` - 发送者的消息
   - `{{to_name}}` - 你的姓名
4. 保存模板并记录下 **Template ID**

### 4. 获取 API Key
1. 在 EmailJS 控制台中，点击 "Account" > "API Keys"
2. 复制你的 **Public Key**

### 5. 配置环境变量
在项目根目录创建 `.env` 文件，添加以下内容：

```env
# EmailJS 配置
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_EMAILJS_TO_NAME=Your Name
```

### 6. 邮件模板示例
以下是一个简单的邮件模板示例：

```html
<!DOCTYPE html>
<html>
<head>
    <title>新的联系表单消息</title>
</head>
<body>
    <h2>你收到了一个新的联系表单消息</h2>
    
    <p><strong>发送者姓名：</strong>{{from_name}}</p>
    <p><strong>发送者邮箱：</strong>{{from_email}}</p>
    <p><strong>消息内容：</strong></p>
    <p>{{message}}</p>
    
    <hr>
    <p><small>此消息来自你的个人网站联系表单</small></p>
</body>
</html>
```

## 功能说明

### 成功情况
- 邮件发送成功
- 数据库保存成功
- 健康检查通过
- 显示成功消息并清空表单

### 错误处理
- 如果邮件发送失败但数据库保存成功，会显示相应提示
- 如果数据库保存失败，会显示错误信息
- 所有错误都会在控制台记录详细信息

### 安全考虑
- 使用环境变量存储敏感信息
- Public Key 是安全的，可以暴露在前端代码中
- 建议在生产环境中使用 HTTPS

## 测试
1. 确保所有配置都正确设置
2. 启动开发服务器：`npm run dev`
3. 访问联系表单页面
4. 填写表单并提交
5. 检查是否收到邮件通知
6. 检查数据库是否保存了记录

## 故障排除

### 常见问题
1. **邮件发送失败**
   - 检查 Service ID、Template ID 和 Public Key 是否正确
   - 确认邮件服务提供商设置正确
   - 检查网络连接

2. **模板变量不显示**
   - 确保模板中的变量名称与代码中的参数名称匹配
   - 检查模板是否正确保存

3. **环境变量不生效**
   - 确保 `.env` 文件在项目根目录
   - 重启开发服务器
   - 检查变量名称是否正确（必须以 `VITE_` 开头）

### 调试
- 打开浏览器开发者工具查看控制台输出
- 检查网络请求是否成功
- 查看 EmailJS 控制台的发送记录 