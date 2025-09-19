/**
 * 商品搜索组件
 * 提供实时搜索功能
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  AutoComplete, 
  Input, 
  Typography, 
  Space, 
  Avatar,
  Spin,
  Empty 
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useProductSearch } from '@/hooks/use-products';
import { useDebouncedCallback } from 'use-debounce';

const { Text } = Typography;

interface ProductSearchProps {
  placeholder?: string;
  className?: string;
  onSelect?: (productSlug: string) => void;
}

export default function ProductSearch({ 
  placeholder = "搜索商品...",
  className = '',
  onSelect
}: ProductSearchProps) {
  const router = useRouter();
  const { results, loading, search, clearResults } = useProductSearch();
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen] = useState(false);

  // 防抖搜索
  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.trim()) {
      search(value.trim());
      setOpen(true);
    } else {
      clearResults();
      setOpen(false);
    }
  }, 300);

  // 处理搜索输入变化
  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  // 处理选择商品
  const handleSelect = (value: string, option: any) => {
    const product = option.product;
    setSearchValue('');
    clearResults();
    setOpen(false);
    
    if (onSelect) {
      onSelect(product.slug);
    } else {
      router.push(`/products/${product.slug}`);
    }
  };

  // 处理搜索提交
  const handleSubmit = () => {
    if (searchValue.trim()) {
      setSearchValue('');
      setOpen(false);
      router.push(`/products?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // 格式化价格
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  // 构建搜索选项
  const options = results.map(product => ({
    key: product.id,
    value: product.id,
    product,
    label: (
      <div className="flex items-center gap-3 py-2">
        <Avatar 
          src={product.images[0]?.url} 
          size="small" 
          shape="square"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{product.name}</div>
          <Space size="small">
            <Text type="secondary" className="text-xs">
              {product.category.name}
            </Text>
            <Text className="text-red-500 font-semibold text-sm">
              {formatPrice(product.price, product.currency)}
            </Text>
          </Space>
        </div>
      </div>
    ),
  }));

  // 添加"查看更多"选项
  if (results.length > 0) {
    options.push({
      key: 'view-all',
      value: 'view-all',
      product: null,
      label: (
        <div 
          className="text-center py-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
          onClick={() => {
            handleSubmit();
          }}
        >
          查看所有 "{searchValue}" 的搜索结果
        </div>
      ),
    });
  }

  return (
    <AutoComplete
      className={className}
      options={options}
      onSelect={handleSelect}
      onSearch={handleSearch}
      value={searchValue}
      open={open}
      onBlur={() => setOpen(false)}
      onFocus={() => searchValue && setOpen(true)}
      notFoundContent={
        loading ? (
          <div className="text-center py-4">
            <Spin size="small" />
            <Text type="secondary" className="ml-2">搜索中...</Text>
          </div>
        ) : searchValue && results.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="没有找到相关商品"
            className="py-4"
          />
        ) : null
      }
    >
      <Input.Search
        placeholder={placeholder}
        onSearch={handleSubmit}
        onPressEnter={handleSubmit}
        size="large"
        allowClear
      />
    </AutoComplete>
  );
}
