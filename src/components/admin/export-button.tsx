/**
 * 导出按钮组件
 * 支持导出为 CSV 或 Excel 格式
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportField {
  key: string;
  label?: string;
}

interface ExportButtonProps {
  data: any[];
  filename: string;
  disabled?: boolean;
  fields?: ExportField[];
}

export function ExportButton({ data, filename, disabled, fields }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  // 导出为 CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    try {
      setExporting(true);

      const headerKeys = fields?.map(field => field.key) ?? Object.keys(data[0]);
      const headerLabels = fields?.map(field => field.label ?? field.key) ?? headerKeys;
      
      // 构建 CSV 内容
      const csvContent = [
        headerLabels.join(','), // 表头
        ...data.map(row => 
          headerKeys.map(header => {
            const value = row[header];
            // 处理包含逗号、引号或换行的值
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(','),
        ),
      ].join('\n');

      // 添加 BOM 以支持中文
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('导出成功');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 导出为 JSON
  const exportToJSON = () => {
    if (data.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    try {
      setExporting(true);

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast.success('导出成功');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || exporting}>
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              导出中...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              导出数据
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="mr-2 h-4 w-4" />
          导出为 CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="mr-2 h-4 w-4" />
          导出为 JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



