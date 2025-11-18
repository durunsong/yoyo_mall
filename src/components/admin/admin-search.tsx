'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Loader2,
  Layout,
  Settings,
  Globe,
  CreditCard,
  Mail,
  Bell,
  Sparkles,
  Megaphone,
  LayoutDashboard,
  BarChart3,
  Home,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

/**
 * 搜索结果类型
 */
interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'user' | 'page' | 'setting';
  title: string;
  subtitle?: string;
  parent?: string;
  url: string;
}

/**
 * 后台全局搜索组件
 * 功能:
 * - 实时搜索商品、订单、用户
 * - 防抖优化
 * - 键盘导航
 * - 点击外部关闭
 */
export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭搜索结果
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 执行搜索
  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();

        if (data.success) {
          setResults(data.results || []);
          setShowResults(true);
          setSelectedIndex(-1);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('搜索失败:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setQuery('');
        break;
    }
  };

  // 点击搜索结果
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setShowResults(false);
    setQuery('');
  };

  // 获取图标（根据标题和类型智能匹配）
  const getIcon = (result: SearchResult) => {
    const { type, title } = result;
    
    // 页面类型根据标题匹配
    if (type === 'page') {
      if (title.includes('仪表板')) return <LayoutDashboard className="h-4 w-4 text-blue-500" />;
      if (title.includes('商品')) return <Package className="h-4 w-4 text-blue-500" />;
      if (title.includes('订单')) return <ShoppingCart className="h-4 w-4 text-green-500" />;
      if (title.includes('用户')) return <Users className="h-4 w-4 text-purple-500" />;
      if (title.includes('数据') || title.includes('分析')) return <BarChart3 className="h-4 w-4 text-indigo-500" />;
      if (title.includes('首页')) return <Home className="h-4 w-4 text-orange-500" />;
      if (title.includes('Footer') || title.includes('页脚')) return <Layout className="h-4 w-4 text-pink-500" />;
      if (title.includes('邮件') || title.includes('订阅')) return <Mail className="h-4 w-4 text-cyan-500" />;
      if (title.includes('通知')) return <Bell className="h-4 w-4 text-yellow-500" />;
      if (title.includes('系统') || title.includes('设置')) return <Settings className="h-4 w-4 text-gray-500" />;
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
    
    // 设置类型根据标题匹配
    if (type === 'setting') {
      if (title.includes('网站')) return <Globe className="h-4 w-4 text-blue-500" />;
      if (title.includes('支付')) return <CreditCard className="h-4 w-4 text-green-500" />;
      if (title.includes('邮件')) return <Mail className="h-4 w-4 text-cyan-500" />;
      if (title.includes('通知')) return <Bell className="h-4 w-4 text-yellow-500" />;
      if (title.includes('商详')) return <Sparkles className="h-4 w-4 text-purple-500" />;
      if (title.includes('公告')) return <Megaphone className="h-4 w-4 text-orange-500" />;
      return <Settings className="h-4 w-4 text-gray-500" />;
    }
    
    // 数据类型
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'user':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return '商品';
      case 'order':
        return '订单';
      case 'user':
        return '用户';
      case 'page':
        return '页面';
      case 'setting':
        return '设置';
      default:
        return '';
    }
  };

  // 获取类型标签颜色
  const getTypeLabelColor = (type: string) => {
    switch (type) {
      case 'product':
        return 'bg-blue-100 text-blue-700';
      case 'order':
        return 'bg-green-100 text-green-700';
      case 'user':
        return 'bg-purple-100 text-purple-700';
      case 'page':
        return 'bg-indigo-100 text-indigo-700';
      case 'setting':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div ref={searchRef} className="w-full max-w-md">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <Input
          clearable
          type="text"
          placeholder="搜索商品、订单、用户..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowResults(true)}
          onClear={() => {
            setQuery('');
            setResults([]);
            setShowResults(false);
          }}
          className="pl-10 pr-10 h-10"
        />
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin z-10" />
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[32rem] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-l-2 ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'border-transparent'
                  }`}
                >
                  {/* 图标 */}
                  <div className="mt-0.5 flex-shrink-0">{getIcon(result)}</div>

                  {/* 内容 */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getTypeLabelColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                      {result.parent && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          · {result.parent}
                        </span>
                      )}
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>搜索中...</span>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 mb-1">未找到相关结果</p>
                  <p className="text-xs text-gray-400">试试搜索"商品"、"订单"或"系统设置"</p>
                </div>
              )}
            </div>
          )}

          {/* 搜索提示 */}
          {!loading && results.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 flex items-center justify-between">
              <span>找到 {results.length} 个结果</span>
              <span className="hidden md:inline">使用 ↑↓ 导航 · Enter 选择 · ESC 关闭</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



