// EmailJS 配置文件
// 请从 EmailJS 控制台获取这些值并替换

export const emailjsConfig = {
  // EmailJS Service ID - 从 EmailJS 控制台的 Email Services 部分获取
  serviceId: 'AWS',
  
  // EmailJS Template ID - 从 EmailJS 控制台的 Email Templates 部分获取
  templateId: 'template_cj24vfg',
  
  // EmailJS Public Key - 从 EmailJS 控制台的 Account > API Keys 部分获取
  publicKey: 'ujQdlzy2YtyVqU3lm',
  
  // 收件人姓名 - 会显示在邮件模板中
  toName: 'Siz'
};

// 环境变量配置（推荐使用）
export const getEmailjsConfig = () => {
  return {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || emailjsConfig.serviceId,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || emailjsConfig.templateId,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || emailjsConfig.publicKey,
    toName: import.meta.env.VITE_EMAILJS_TO_NAME || emailjsConfig.toName
  };
}; 