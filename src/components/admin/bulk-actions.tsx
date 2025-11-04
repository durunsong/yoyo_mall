/**
 * 批量操作组件
 * 用于展示已选择的记录数量，并触发批量操作下拉菜单
 */

'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface BulkActionItem {
  /** 批量操作展示文案 */
  label: string;
  /** 操作的唯一标识，用于回调 */
  value: string;
  /** 可选的操作图标，提升辨识度 */
  icon?: LucideIcon;
  /** 视觉变体，支持 destructive 提示危险操作 */
  variant?: 'default' | 'destructive';
  /** 是否禁用本次操作 */
  disabled?: boolean;
}

interface BulkActionsProps {
  /** 已选择的记录 ID 列表 */
  selectedIds: string[];
  /** 下拉菜单中可用的批量操作选项 */
  actions: BulkActionItem[];
  /** 触发具体批量操作的回调函数 */
  onAction: (action: string) => void | Promise<void>;
  /** 可选：清空当前选择 */
  onClearSelection?: () => void;
  /** 可选：在请求处理中禁用交互 */
  disabled?: boolean;
  /** 可选：自定义描述文案 */
  description?: string;
}

export function BulkActions({
  selectedIds,
  actions,
  onAction,
  onClearSelection,
  disabled = false,
  description,
}: BulkActionsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  if (selectedIds.length === 0) {
    return null;
  }

  /**
   * 触发选中的批量操作
   * @param value 操作标识
   */
  const handleAction = async (value: string) => {
    if (disabled) return;
    setPendingAction(value);
    try {
      await onAction(value);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
          {selectedIds.length}
        </span>
        <span>{description ?? '项已选中，可执行批量操作'}</span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled || actions.length === 0}>
              批量操作
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            {actions.map((action) => {
              const Icon = action.icon;
              const isPending = pendingAction === action.value;
              return (
                <DropdownMenuItem
                  key={action.value}
                  onClick={() => handleAction(action.value)}
                  className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                  disabled={disabled || action.disabled || isPending}
                >
                  {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {onClearSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={disabled || pendingAction !== null}
          >
            取消选择
          </Button>
        )}
      </div>
    </div>
  );
}
