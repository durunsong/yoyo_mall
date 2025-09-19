/**
 * 联系表单组件
 * 使用react-hook-form和zod进行表单验证
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// 表单验证schema
const contactSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  subject: z.string().min(5, '主题至少需要5个字符'),
  message: z.string().min(20, '消息至少需要20个字符'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void | Promise<void>;
  className?: string;
}

export function ContactForm({ onSubmit, className }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const handleFormSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // 默认提交逻辑
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setSubmitSuccess(true);
      reset();
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('表单提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>联系我们</CardTitle>
      </CardHeader>
      <CardContent>
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
            感谢您的留言！我们会尽快回复您。
          </div>
        )}
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            label="姓名"
            {...register('name')}
            error={errors.name?.message}
            placeholder="请输入您的姓名"
            required
          />
          
          <Input
            label="邮箱"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="请输入您的邮箱地址"
            required
          />
          
          <Input
            label="主题"
            {...register('subject')}
            error={errors.subject?.message}
            placeholder="请输入联系主题"
            required
          />
          
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">
              消息 <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register('message')}
              placeholder="请输入您的消息内容"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>
          
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="发送中..."
            className="w-full"
          >
            发送消息
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
