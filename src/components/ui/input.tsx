/**
 * Input组件
 * 基础输入框组件
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// Input组件Props接口
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 错误信息 */
  error?: string;
  /** 标签文本 */
  label?: string;
  /** 帮助文本 */
  helperText?: string;
}

/**
 * Input组件
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, id, ...props }, ref) => {
    // 使用React 18+的useId hook来生成稳定的ID，避免SSR水合不匹配
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <input
          type={type}
          className={cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          ref={ref}
          id={inputId}
          {...props}
        />

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-muted-foreground text-sm">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
