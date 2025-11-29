'use client';

import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export interface EmailSendLog {
  id: string;
  subject: string;
  status: 'PENDING' | 'SENDING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  sendType: 'SINGLE' | 'MULTI' | 'ALL';
  recipientCount: number;
  successCount: number;
  failureCount: number;
  failureReason?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface SendHistoryTableProps {
  data: EmailSendLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

/**
 * 邮件发送记录
 */
export function SendHistoryTable({ data, loading, onRefresh }: SendHistoryTableProps) {
  const statusColorMap: Record<EmailSendLog['status'], string> = useMemo(
    () => ({
      PENDING: 'bg-slate-200 text-slate-700',
      SENDING: 'bg-blue-100 text-blue-700',
      SUCCESS: 'bg-emerald-100 text-emerald-700',
      PARTIAL: 'bg-amber-100 text-amber-700',
      FAILED: 'bg-rose-100 text-rose-700',
    }),
    [],
  );

  const typeLabelMap: Record<EmailSendLog['sendType'], string> = {
    SINGLE: '单发',
    MULTI: '批量',
    ALL: '全量',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>发送记录</CardTitle>
          <CardDescription>最近 10 条后台邮件操作日志</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>主题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>收件人数</TableHead>
              <TableHead>成功/失败</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-slate-500">
                  正在加载发送记录...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-slate-500">
                  暂无发送记录
                </TableCell>
              </TableRow>
            ) : (
              data.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{log.subject}</span>
                      {log.failureReason && (
                        <span className="text-xs text-rose-500">失败原因：{log.failureReason}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColorMap[log.status]}>{log.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabelMap[log.sendType]}</Badge>
                  </TableCell>
                  <TableCell>{log.recipientCount}</TableCell>
                  <TableCell>
                    <span className="text-emerald-600">{log.successCount}</span>
                    <span className="mx-1 text-slate-400">/</span>
                    <span className="text-rose-500">{log.failureCount}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">{log.createdBy.name || '管理员'}</p>
                      <p className="text-xs text-slate-500">{log.createdBy.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

