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
import { buildProductSearchHref } from '@/lib/products/query';

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
    router.push(buildProductSearchHref(searchValue));

    // 执行搜索后调用回调（用于关闭移动端搜索框等）
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  return (
    <form
      className={`relative flex ${className}`}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        handleSearch();
      }}
    >
      <Input
        clearable
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onClear={() => {
          setSearchValue('');
          // 清空后也可以触发搜索（显示所有商品）
          router.push('/products');
        }}
        className="pr-10"
      />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 hover:bg-accent"
        aria-label="搜索"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
