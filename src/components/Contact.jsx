import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import emailjs from '@emailjs/browser';

import { styles } from "../styles";
import { EarthCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { slideIn } from "../utils/motion";
import { getEmailjsConfig } from "../config/emailjs";
import { API_ENDPOINTS } from "../config/api";

const Contact = () => {
  const formRef = useRef();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { target } = e;
    const { name, value } = target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // 获取 EmailJS 配置
    const { serviceId, templateId, publicKey, toName } = getEmailjsConfig();

    // 准备 EmailJS 模板参数
    const templateParams = {
      from_name: form.name,
      from_email: form.email,
      message: form.message,
      to_name: toName,
    };

    // 同时处理 EmailJS 发送邮件和数据库保存
    const sendEmail = emailjs.send(serviceId, templateId, templateParams, publicKey);
    const saveToDatabase = axios.post(API_ENDPOINTS.CONTACT, form);
    const healthCheck = axios.get(API_ENDPOINTS.HEALTH);

    // 使用 Promise.all 同时处理所有请求
    Promise.all([sendEmail, saveToDatabase, healthCheck])
      .then(([emailResponse, dbResponse, healthResponse]) => {
        setLoading(false);
        
        // 邮件发送成功
        console.log('Email sent successfully:', emailResponse);
        
        // 数据库保存成功
        console.log('Database save successful:', dbResponse.data);
        
        // 健康检查成功
        console.log('Health Check Success:', healthResponse.data);
        
        // 显示成功消息
        alert('消息发送成功！我会尽快回复你。');
        
        // 清空表单
        setForm({
          name: "",
          email: "",
          message: "",
        });
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error:", error);
        
        // 根据错误类型显示不同的错误消息
        if (error.message && error.message.includes('EmailJS')) {
          alert('邮件发送失败，但消息已保存到数据库。请稍后重试。');
        } else if (error.response?.data?.error) {
          alert(error.response.data.error);
        } else {
          alert('发送失败，请稍后重试。');
        }
      });
  };

  return (
    <div
      className={`xl:mt-12 flex xl:flex-row flex-col-reverse gap-10 overflow-hidden`}
    >
      <motion.div
        variants={slideIn("left", "tween", 0.2, 1)}
        className='flex-[0.75] bg-black-100 p-8 rounded-2xl'
      >
        <p className={styles.sectionSubText}>
          Get in touch
        </p>
        <h3 className={styles.sectionHeadText}>Contact</h3>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='mt-12 flex flex-col gap-8'
        >
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>Your Name</span>
            <input
              type='text'
              name='name'
              value={form.name}
              onChange={handleChange}
              placeholder="What's your good name?"
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
              required
            />
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>Your email</span>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              placeholder="What's your web address?"
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
              required
            />
          </label>
          <label className='flex flex-col'>
            <span className='text-white font-medium mb-4'>Your Message</span>
            <textarea
              rows={7}
              name='message'
              value={form.message}
              onChange={handleChange}
              placeholder='What you want to say?'
              className='bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium'
              required
            />
          </label>

          <button
            type='submit'
            disabled={loading}
            className='bg-tertiary py-3 px-8 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? "Sending..." : "Send"}
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

const ContactWithWrapper = SectionWrapper(Contact, "contact");
export default ContactWithWrapper;
