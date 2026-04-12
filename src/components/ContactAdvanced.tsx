import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import emailjs from '@emailjs/browser';

import { styles } from "../styles";
import { EarthCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { slideIn } from "../utils/motion.ts";
import { getEmailjsConfig } from "../config/emailjs";

const ContactAdvanced = () => {
  const { t } = useTranslation();
  const formRef = useRef();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    type: '', // 'success', 'error', 'warning'
    message: '',
    details: {}
  });

  const handleChange = (e) => {
    const { target } = e;
    const { name, value } = target;

    setForm({
      ...form,
      [name]: value,
    });

    // 清除之前的错误状态
    if (status.type === 'error') {
      setStatus({ type: '', message: '', details: {} });
    }
  };

  const showStatus = (type, message, details = {}) => {
    setStatus({ type, message, details });
    
    // 自动清除成功消息
    if (type === 'success') {
      setTimeout(() => {
        setStatus({ type: '', message: '', details: {} });
      }, 5000);
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showStatus('error', t('contact.error_name'));
      return false;
    }
    if (!form.email.trim()) {
      showStatus('error', t('contact.error_email'));
      return false;
    }
    if (!form.email.includes('@')) {
      showStatus('error', t('contact.error_email_invalid'));
      return false;
    }
    if (!form.message.trim()) {
      showStatus('error', t('contact.error_message'));
      return false;
    }
    if (form.message.length < 10) {
      showStatus('error', t('contact.error_message_short'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '', details: {} });

    try {
      // 获取 EmailJS 配置
      const { serviceId, templateId, publicKey, toName } = getEmailjsConfig();

      // 准备 EmailJS 模板参数
      const templateParams = {
        name: form.name,
        email: form.email,
        message: form.message,
        to_name: toName,
        timestamp: new Date().toLocaleString('zh-CN'),
      };

      // 发送邮件
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      showStatus('success', t('contact.success'));
      setForm({ name: "", email: "", message: "" });


    } catch (error) {
      console.error('Contact form error:', error);
      showStatus('error', t('contact.error'), { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return '';
    }
  };

  const getStatusIcon = () => {
    switch (status.type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return '';
    }
  };

  return (
    <div className={`xl:mt-12 flex xl:flex-row flex-col-reverse gap-10 overflow-hidden`}>
      <motion.div
        variants={slideIn("left", "tween", 0.2, 1)}
        className='flex-[0.75] bg-black-100 p-8 rounded-2xl'
      >
        <p className={styles.sectionSubText}>
          {t('contact.subtitle')}
        </p>
        <h3 className={styles.sectionHeadText}>{t('contact.title')}</h3>

        {/* 状态消息显示 */}
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg border ${
              status.type === 'success' ? 'bg-green-900/20 border-green-500/30' :
              status.type === 'error' ? 'bg-red-900/20 border-red-500/30' :
              'bg-yellow-900/20 border-yellow-500/30'
            }`}
          >
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              <span className="text-lg">{getStatusIcon()}</span>
              <span className="font-medium">{status.message}</span>
            </div>
            {Object.keys(status.details).length > 0 && (
              <details className="mt-2 text-sm text-gray-400">
                <summary className="cursor-pointer">查看详细信息</summary>
                <pre className="mt-1 text-xs overflow-auto">
                  {JSON.stringify(status.details, null, 2)}
                </pre>
              </details>
            )}
          </motion.div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='mt-12 flex flex-col gap-8'
        >
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>{t('contact.name_label')}</span>
            <input
              type='text'
              name='name'
              value={form.name}
              onChange={handleChange}
              placeholder={t("contact.name_placeholder")}
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
              required
              disabled={loading}
            />
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>{t('contact.email_label')}</span>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              placeholder={t("contact.email_placeholder")}
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
              required
              disabled={loading}
            />
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>{t('contact.message_label')}</span>
            <textarea
              rows={7}
              name='message'
              value={form.message}
              onChange={handleChange}
              placeholder={t("contact.message_placeholder")}
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
              required
              disabled={loading}
            />
          </label>

          <button
            type='submit'
            disabled={loading}
            className='bg-tertiary py-3 px-8 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tertiary/80 transition-colors'
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t("contact.sending")}
              </div>
            ) : (
              t("contact.send")
            )}
          </button>
        </form>
      </motion.div>

      <motion.div
        variants={slideIn("right", "tween", 0.2, 1)}
        className='xl:flex-1 xl:h-auto md:h-[550px] h-[350px]'
      >
        <EarthCanvas />
      </motion.div>
    </div>
  );
};

const ContactAdvancedWrapped = SectionWrapper(ContactAdvanced, "contact");
export default ContactAdvancedWrapped; 