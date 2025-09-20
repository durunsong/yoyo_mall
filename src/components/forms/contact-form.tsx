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
import { useStaticTranslations } from '@/hooks/use-i18n';

// 表单验证schema - 使用翻译
const getContactSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t('nameMinLength')),
  email: z.string().email(t('emailInvalid')),
  subject: z.string().min(5, t('subjectMinLength')),
  message: z.string().min(20, t('messageMinLength')),
});

interface ContactFormProps {
  onSubmit?: (data: any) => void | Promise<void>;
  className?: string;
}

export function ContactForm({ onSubmit, className }: ContactFormProps) {
  const { t } = useStaticTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const contactSchema = getContactSchema(t);
  type ContactFormData = z.infer<typeof contactSchema>;

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
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setSubmitSuccess(true);
      reset();
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error(t('formSubmitFailed'), error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('contactUs')}</CardTitle>
      </CardHeader>
      <CardContent>
        {submitSuccess && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {t('thankYouMessage')}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            label={t('name')}
            {...register('name')}
            error={errors.name?.message}
            placeholder={t('enterYourName')}
            required
          />

          <Input
            label={t('email')}
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder={t('enterYourEmail')}
            required
          />

          <Input
            label={t('subject')}
            {...register('subject')}
            error={errors.subject?.message}
            placeholder={t('enterSubject')}
            required
          />

          <div className="space-y-1">
            <label className="text-sm leading-none font-medium">
              {t('message')} <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register('message')}
              placeholder={t('enterYourMessage')}
              rows={4}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.message && (
              <p className="text-destructive text-sm">
                {errors.message.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            loadingText={t('sending')}
            className="w-full"
          >
            {t('sendMessage')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
