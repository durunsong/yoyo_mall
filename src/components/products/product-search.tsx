/**
 * 商品搜索组件 - shadcn/ui版本
 * 商品搜索功能
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProductSearchProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

export default function ProductSearch({ 
  placeholder = '搜索商品...', 
  onSearch,
  className = '', 
}: ProductSearchProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    // 默认行为：跳转到商品列表页并传递搜索关键词
    if (searchValue.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      router.push('/products');
    }

    // 执行搜索后调用回调（用于关闭移动端搜索框等）
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  // 修改为 onKeyDown 以确保回车键能正常触发
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 防止表单提交
      handleSearch();
    }
  };

  return (
    <div className={`relative flex ${className}`}>
      <Input
        clearable
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onClear={() => {
          setSearchValue('');
          // 清空后也可以触发搜索（显示所有商品）
          router.push('/products');
        }}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 hover:bg-accent"
        onClick={handleSearch}
        aria-label="搜索"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}