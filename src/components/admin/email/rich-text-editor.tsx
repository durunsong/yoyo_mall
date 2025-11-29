'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Image,
  Type,
  Eraser,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmailRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const toolbarButtons = [
  { icon: Bold, command: 'bold', label: '加粗' },
  { icon: Italic, command: 'italic', label: '斜体' },
  { icon: Underline, command: 'underline', label: '下划线' },
  { icon: Type, command: 'formatBlock', value: 'h2', label: '标题' },
  { icon: ListOrdered, command: 'insertOrderedList', label: '有序列表' },
  { icon: List, command: 'insertUnorderedList', label: '无序列表' },
];

/**
 * 轻量富文本编辑器，基于 contentEditable 与 document.execCommand
 * 兼容 React 19，避免依赖 findDOMNode 的第三方组件
 */
export function EmailRichTextEditor({
  value,
  onChange,
  placeholder = '请输入邮件正文，支持富文本、图片、链接等内容',
  className,
}: EmailRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? '');
  };

  const handleLink = () => {
    const url = window.prompt('请输入链接地址 (包含 http/https)：');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleImage = () => {
    const url = window.prompt('请输入图片地址：');
    if (url) {
      handleCommand('insertImage', url);
    }
  };

  const clearFormatting = () => {
    handleCommand('removeFormat');
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML ?? '');
  };

  const placeholderHtml = useMemo(
    () => `<span class="text-slate-400">${placeholder}</span>`,
    [placeholder],
  );

  const showPlaceholder = !value || value === '<p><br></p>';

  return (
    <div className={cn('rounded-lg border border-slate-200', className)}>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        {toolbarButtons.map(btn => (
          <Button
            key={btn.label}
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleCommand(btn.command, btn.value)}
            title={btn.label}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleLink}
          title="插入链接"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleImage}
          title="插入图片"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={clearFormatting}
          title="清除格式"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative min-h-[260px]">
        {showPlaceholder && (
          <div
            className="pointer-events-none absolute inset-0 select-none px-3 py-2 text-sm"
            dangerouslySetInnerHTML={{ __html: placeholderHtml }}
          />
        )}
        <div
          ref={editorRef}
          className="prose prose-slate max-w-none px-3 py-2 text-sm focus:outline-none"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
        />
      </div>
    </div>
  );
}

