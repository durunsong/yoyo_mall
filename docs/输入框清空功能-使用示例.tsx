/**
 * 输入框一键清空功能 - 使用示例
 * 展示如何在项目中使用 clearable 功能
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Mail, User } from 'lucide-react';

// ============================================
// 示例 1: 基础搜索框
// ============================================
export function BasicSearchExample() {
  const [search, setSearch] = useState('');

  return (
    <Input
      clearable
      placeholder="搜索..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}

// ============================================
// 示例 2: 带图标的搜索框
// ============================================
export function SearchWithIconExample() {
  const [search, setSearch] = useState('');

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        clearable
        placeholder="搜索商品..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => {
          setSearch('');
          console.log('搜索已清空');
        }}
        className="pl-10"
      />
    </div>
  );
}

// ============================================
// 示例 3: 登录表单
// ============================================
export function LoginFormExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          clearable
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </div>
  );
}

// ============================================
// 示例 4: 用户资料编辑
// ============================================
export function ProfileFormExample() {
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    location: '',
    bio: '',
  });

  const updateProfile = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <Input
            clearable
            id="name"
            value={profile.name}
            onChange={(e) => updateProfile('name', e.target.value)}
            placeholder="请输入姓名"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">电话</Label>
          <Input
            clearable
            id="phone"
            type="tel"
            value={profile.phone}
            onChange={(e) => updateProfile('phone', e.target.value)}
            placeholder="请输入电话号码"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">地址</Label>
        <Input
          clearable
          id="location"
          value={profile.location}
          onChange={(e) => updateProfile('location', e.target.value)}
          placeholder="请输入地址"
        />
      </div>
    </div>
  );
}

// ============================================
// 示例 5: 商品筛选器
// ============================================
export function ProductFilterExample() {
  const [filters, setFilters] = useState({
    name: '',
    sku: '',
    category: '',
  });

  const updateFilter = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const clearAllFilters = () => {
    setFilters({ name: '', sku: '', category: '' });
  };

  return (
    <div className="space-y-3 max-w-md">
      <Input
        clearable
        placeholder="按商品名称筛选..."
        value={filters.name}
        onChange={(e) => updateFilter('name', e.target.value)}
        onClear={() => console.log('名称筛选已清空')}
      />

      <Input
        clearable
        placeholder="按 SKU 筛选..."
        value={filters.sku}
        onChange={(e) => updateFilter('sku', e.target.value)}
      />

      <Input
        clearable
        placeholder="按分类筛选..."
        value={filters.category}
        onChange={(e) => updateFilter('category', e.target.value)}
      />

      <button
        onClick={clearAllFilters}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        清空所有筛选
      </button>
    </div>
  );
}

// ============================================
// 示例 6: 带验证的表单
// ============================================
export function ValidatedFormExample() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('请输入有效的邮箱地址');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="space-y-2 max-w-sm">
      <Label htmlFor="email">邮箱地址</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          clearable
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            validateEmail(e.target.value);
          }}
          onClear={() => {
            setEmail('');
            setEmailError('');
          }}
          className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
        />
      </div>
      {emailError && (
        <p className="text-sm text-red-500">{emailError}</p>
      )}
    </div>
  );
}

// ============================================
// 示例 7: 实时搜索（带防抖）
// ============================================
export function LiveSearchExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 模拟 API 搜索
  const performSearch = async (term: string) => {
    if (!term) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    // 模拟 API 延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟搜索结果
    setResults([
      `结果 1: ${term}`,
      `结果 2: ${term}`,
      `结果 3: ${term}`,
    ]);
    
    setIsSearching(false);
  };

  return (
    <div className="max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          clearable
          placeholder="实时搜索..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            performSearch(e.target.value);
          }}
          onClear={() => {
            setSearchTerm('');
            setResults([]);
          }}
          className="pl-10"
        />
      </div>

      {isSearching && (
        <p className="mt-2 text-sm text-gray-500">搜索中...</p>
      )}

      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map((result, index) => (
            <div key={index} className="p-2 hover:bg-gray-50 rounded">
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 示例 8: 多字段联动清空
// ============================================
export function LinkedFieldsExample() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
  });

  const updateFirstName = (value: string) => {
    setFormData({
      firstName: value,
      lastName: formData.lastName,
      fullName: value + ' ' + formData.lastName,
    });
  };

  const updateLastName = (value: string) => {
    setFormData({
      firstName: formData.firstName,
      lastName: value,
      fullName: formData.firstName + ' ' + value,
    });
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>名</Label>
          <Input
            clearable
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => updateFirstName(e.target.value)}
            onClear={() => updateFirstName('')}
          />
        </div>

        <div className="space-y-2">
          <Label>姓</Label>
          <Input
            clearable
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => updateLastName(e.target.value)}
            onClear={() => updateLastName('')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>全名（自动生成）</Label>
        <Input
          value={formData.fullName}
          disabled
          className="bg-gray-50"
        />
      </div>
    </div>
  );
}

// ============================================
// 完整演示页面
// ============================================
export default function InputClearableDemo() {
  return (
    <div className="container mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">输入框清空功能演示</h1>
        <p className="text-gray-600">展示 Input 组件的 clearable 功能使用方式</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. 基础搜索框</h2>
        <BasicSearchExample />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. 带图标的搜索框</h2>
        <SearchWithIconExample />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. 登录表单</h2>
        <LoginFormExample />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. 用户资料编辑</h2>
        <ProfileFormExample />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. 商品筛选器</h2>
        <ProductFilterExample />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">6. 带验证的表单</h2>
        <ValidatedFormExample />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">7. 实时搜索</h2>
        <LiveSearchExample />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">8. 多字段联动清空</h2>
        <LinkedFieldsExample />
      </section>
    </div>
  );
}

