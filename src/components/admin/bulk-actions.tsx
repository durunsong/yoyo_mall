/**
 * 批量操作组件
 * 用于表格的批量选择和操作
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Trash2, Archive, Eye, EyeOff } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkArchive?: () => void;
  onBulkPublish?: () => void;
  onBulkUnpublish?: () => void;
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkArchive,
  onBulkPublish,
  onBulkUnpublish,
}: BulkActionsProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={() => {
            if (allSelected || someSelected) {
              onClearSelection();
            } else {
              onSelectAll();
            }
          }}
          aria-label="全选"
        />
        <span className="text-sm text-gray-700">
          {selectedCount > 0 ? `已选择 ${selectedCount} 项` : '全选'}
        </span>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                批量操作
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {onBulkPublish && (
                <DropdownMenuItem onClick={onBulkPublish}>
                  <Eye className="mr-2 h-4 w-4" />
                  批量发布
                </DropdownMenuItem>
              )}
              {onBulkUnpublish && (
                <DropdownMenuItem onClick={onBulkUnpublish}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  批量下架
                </DropdownMenuItem>
              )}
              {onBulkArchive && (
                <DropdownMenuItem onClick={onBulkArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  批量归档
                </DropdownMenuItem>
              )}
              {onBulkDelete && (
                <DropdownMenuItem
                  onClick={onBulkDelete}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  批量删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            取消选择
          </Button>
        </div>
      )}
    </div>
  );
}

