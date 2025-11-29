'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Send } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/admin/admin-layout';
import {
  EmailRecipientSelector,
  EmailRecipient,
} from '@/components/admin/email/recipient-selector';
import { EmailRichTextEditor } from '@/components/admin/email/rich-text-editor';
import {
  SendHistoryTable,
  EmailSendLog,
} from '@/components/admin/email/send-history-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const MAX_RECIPIENTS = 500;

export default function AdminEmailPage() {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('<p>亲爱的用户，</p><p>这里是您的邮件内容...</p>');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, EmailRecipient>>({});
  const [sendMode, setSendMode] = useState<'SELECTED' | 'ALL'>('SELECTED');
  const [complianceAccepted, setComplianceAccepted] = useState(false);
  const [sending, setSending] = useState(false);

  const [logs, setLogs] = useState<EmailSendLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const selectedCount = Object.keys(selectedRecipients).length;

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await fetch('/api/admin/email/logs?limit=10');
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs);
      } else {
        toast.error(data.error || '发送记录加载失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('发送记录加载失败，请稍后再试');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.warning('请填写邮件主题');
      return;
    }

    if (!htmlContent || htmlContent.replace(/<(.|\n)*?>/g, '').trim().length < 5) {
      toast.warning('请完善邮件正文内容');
      return;
    }

    if (!complianceAccepted) {
      toast.warning('请勾选合规声明后再发送');
      return;
    }

    if (sendMode === 'SELECTED' && selectedCount === 0) {
      toast.warning('请至少选择一位收件人');
      return;
    }

    const payload = {
      subject: subject.trim(),
      htmlContent,
      recipientType:
        sendMode === 'ALL'
          ? 'ALL'
          : selectedCount === 1
            ? 'SINGLE'
            : 'MULTI',
      recipientIds: sendMode === 'ALL' ? undefined : Object.keys(selectedRecipients),
      complianceAccepted: true,
      additionalNotes: additionalNotes.trim() || undefined,
    };

    setSending(true);
    try {
      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || '发送失败，请稍后再试');
        return;
      }

      toast.success(data.message || '邮件发送完成');

      // 成功后刷新记录并重置部分状态
      fetchLogs();
      if (sendMode === 'SELECTED') {
        setSelectedRecipients({});
      }
    } catch (error) {
      console.error(error);
      toast.error('发送失败，请稍后再试');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">邮件管理</h1>
          <p className="text-sm text-slate-600">
            自定义向用户发送跨境合规邮件，支持单发、批量以及全量广播
          </p>
        </div>

        <EmailRecipientSelector
          selected={selectedRecipients}
          onChange={setSelectedRecipients}
          mode={sendMode}
          onModeChange={setSendMode}
          maxRecipients={MAX_RECIPIENTS}
        />

        <Card>
          <CardHeader>
            <CardTitle>邮件主题与合规说明</CardTitle>
            <CardDescription>为用户提供清晰的邮件主题，并确认跨境发送合规性</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">邮件主题</Label>
              <Input
                placeholder="如：12.12 黑五联合满减，跨境专享折扣"
                value={subject}
                onChange={event => setSubject(event.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">
                合规附注（可选）
              </Label>
              <Textarea
                placeholder="如：本邮件包含跨境电商优惠活动，如需退订请告知..."
                value={additionalNotes}
                onChange={event => setAdditionalNotes(event.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="space-y-2 text-sm text-slate-700">
                <p>发送邮件前，需确认内容符合跨境电商营销规范：</p>
                <ul className="list-disc pl-5">
                  <li>不得包含虚假宣传、违规承诺及敏感词</li>
                  <li>必须提供有效的退订渠道与联系方式</li>
                  <li>严禁向未授权用户或黑名单用户发送</li>
                </ul>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="compliance"
                    checked={complianceAccepted}
                    onCheckedChange={value => setComplianceAccepted(Boolean(value))}
                  />
                  <Label htmlFor="compliance" className="text-sm text-slate-900">
                    我已完成内容审查，确认本次发送符合跨境电商邮件规范
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>邮件正文</CardTitle>
            <CardDescription>支持富文本、图片、链接等格式</CardDescription>
          </CardHeader>
          <CardContent>
            <EmailRichTextEditor value={htmlContent} onChange={setHtmlContent} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="lg"
            className="gap-2"
            onClick={handleSend}
            disabled={sending}
          >
            <Send className="h-4 w-4" />
            {sending ? '发送中...' : '立即发送'}
          </Button>
        </div>

        <SendHistoryTable data={logs} loading={logsLoading} onRefresh={fetchLogs} />
      </div>
    </AdminLayout>
  );
}

