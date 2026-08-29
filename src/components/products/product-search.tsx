/**
 * 商品搜索组件 - shadcn/ui版本
 * 商品搜索功能
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
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
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pr-20"
      />

      {searchValue && (
        <button
          type="button"
          onClick={() => {
            setSearchValue('');
            onSearch?.('');
            router.push('/products');
          }}
          className="absolute right-11 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="清空搜索"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-accent"
        aria-label="搜索"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
