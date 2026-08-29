'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { formatDate } from '@/lib/utils';

export interface EmailRecipient {
  id: string;
  email: string;
  name?: string | null;
  country?: string | null;
  locale?: string | null;
  timezone?: string | null;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RecipientSelectorProps {
  selected: Record<string, EmailRecipient>;
  onChange: (next: Record<string, EmailRecipient>) => void;
  mode: 'SELECTED' | 'ALL';
  onModeChange: (mode: 'SELECTED' | 'ALL') => void;
  disabled?: boolean;
  maxRecipients: number;
}

interface RecipientResponse {
  success: boolean;
  data?: {
    recipients: EmailRecipient[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

/**
 * 后台邮件 - 收件人选择器
 */
export function EmailRecipientSelector({
  selected,
  onChange,
  mode,
  onModeChange,
  disabled,
  maxRecipients,
}: RecipientSelectorProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  const loadRecipients = async (nextPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(pagination.limit),
      });
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const response = await fetch(`/api/admin/email/recipients?${params.toString()}`);
      const data: RecipientResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || '获取收件人失败');
      }

      setRecipients(data.data.recipients);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error(error);
      toast.error('收件人列表加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadRecipients(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    loadRecipients(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleRecipient = (recipient: EmailRecipient) => {
    const nextSelected = { ...selected };
    if (nextSelected[recipient.id]) {
      delete nextSelected[recipient.id];
    } else {
      if (Object.keys(nextSelected).length >= maxRecipients) {
        toast.warning(`单次最多选择 ${maxRecipients} 位收件人`);
        return;
      }
      nextSelected[recipient.id] = recipient;
    }
    onChange(nextSelected);
  };

  const togglePageSelection = (checked: boolean) => {
    if (!checked) {
      const idsOnPage = recipients.map(recipient => recipient.id);
      const nextSelected = { ...selected };
      idsOnPage.forEach(id => {
        delete nextSelected[id];
      });
      onChange(nextSelected);
      return;
    }

    const nextSelected = { ...selected };
    for (const recipient of recipients) {
      if (Object.keys(nextSelected).length >= maxRecipients) {
        toast.warning(`单次最多选择 ${maxRecipients} 位收件人`);
        break;
      }
      nextSelected[recipient.id] = recipient;
    }
    onChange(nextSelected);
  };

  const allSelectedInPage = recipients.length > 0 && recipients.every(recipient => selected[recipient.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>收件人</CardTitle>
        <CardDescription>
          已选择 <span className="font-semibold text-blue-600">{selectedCount}</span> / {maxRecipients} 位用户
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索邮箱 / 姓名"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadRecipients(page)}
              className="shrink-0"
              title="刷新列表"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">发送给全部用户</p>
              <p className="text-xs text-slate-500">
                启用后将忽略手动选择，向当前符合条件的全部用户群发
              </p>
            </div>
            <Switch
              checked={mode === 'ALL'}
              onCheckedChange={checked => onModeChange(checked ? 'ALL' : 'SELECTED')}
              disabled={disabled}
            />
          </div>
        </div>

        {mode === 'SELECTED' && (
          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelectedInPage}
                  onCheckedChange={value => togglePageSelection(Boolean(value))}
                  disabled={disabled || loading || recipients.length === 0}
                />
                <Label className="text-sm text-slate-600">当前页全选</Label>
              </div>
              <Badge variant="secondary">共 {pagination.total} 位潜在收件人</Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>用户</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>地区</TableHead>
                    <TableHead>订单数</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-slate-500">
                        正在加载收件人...
                      </TableCell>
                    </TableRow>
                  ) : recipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-slate-500">
                        暂无符合条件的用户
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipients.map(recipient => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <Checkbox
                            checked={Boolean(selected[recipient.id])}
                            onCheckedChange={() => toggleRecipient(recipient)}
                            disabled={disabled}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {recipient.name || '未命名用户'}
                            </span>
                            <span className="text-xs text-slate-500">{recipient.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{recipient.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {recipient.country || recipient.locale || '未知'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{recipient.orderCount}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(recipient.createdAt, 'date')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="border-t px-4 py-3">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={pageNumber => setPage(pageNumber)}
              />
            </div>
          </div>
        )}

        {mode === 'ALL' && (
          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950">
            <p className="font-medium text-blue-900">当前将向全量用户发送邮件。</p>
            <p className="mt-1 text-xs text-blue-800">
              系统会在发送前自动截取 {maxRecipients} 人的安全上限，如需覆盖更多收件人，请分批次发送或按条件筛选后使用批量发送。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
