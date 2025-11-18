import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  clearable?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, clearable = false, onClear, value, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || '');
    
    // 同步外部 value 到内部状态
    React.useEffect(() => {
      setInternalValue(value || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      setInternalValue('');
      
      // 调用 onClear 回调
      onClear?.();
      
      // 触发 onChange 事件，模拟用户清空输入
      if (onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    // 如果不需要清空功能，返回普通 input
    if (!clearable) {
      return (
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          {...props}
        />
      );
    }

    // 可清空的 input（带清空按钮）
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            // 如果有清空按钮，右侧留出空间
            internalValue && 'pr-9',
            className,
          )}
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          {...props}
        />
        
        {/* 清空按钮 - 只在有内容且未禁用时显示 */}
        {internalValue && !props.disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
            aria-label="清空输入"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
