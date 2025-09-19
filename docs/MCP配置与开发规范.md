# MCP配置与开发规范

_跨境电商网站开发的标准化规范_

## 🔧 MCP (Model Context Protocol) 配置

### 1. 基础配置文件

#### .cursorrules

```yaml
# 跨境电商网站开发规范
project_type: 'Cross-border E-commerce Website'
framework: 'Next.js 15 + React 19'
language: 'TypeScript'
styling: 'Tailwind CSS'
database: 'PostgreSQL + Prisma'

# 开发原则
development_principles:
  - '用中文进行沟通和注释'
  - '不要随意删改已有功能和逻辑'
  - '每次修改代码前，不清楚的地方及时提问'
  - '不要修改其他未提及的功能'
  - '尽可能做详细的注释'
  - '严谨仔细，代码风格优雅'
  - '高性能，高可用，可扩展'

# 代码质量要求
code_quality:
  - 'TypeScript严格模式'
  - 'ESLint + Prettier代码格式化'
  - '组件化和模块化设计'
  - '响应式设计(PC+移动端)'
  - '性能优化优先'
  - '无障碍访问支持'

# 架构要求
architecture:
  - '清晰的文件夹结构'
  - '分层架构设计'
  - 'API设计RESTful规范'
  - '状态管理使用Zustand'
  - '国际化支持(next-intl)'

# 安全要求
security:
  - '输入验证和清理'
  - 'SQL注入防护'
  - 'XSS攻击防护'
  - 'CSRF保护'
  - '敏感信息加密'
```

#### .gitignore 配置

```gitignore
# 依赖
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 数据库
*.db
*.sqlite

# 日志
logs/
*.log

# 编辑器
.vscode/
.idea/
*.swp
*.swo

# 操作系统
.DS_Store
Thumbs.db

# 测试覆盖率
coverage/

# 临时文件
tmp/
temp/
```

### 2. 开发环境配置

#### VSCode 配置 (.vscode/settings.json)

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

#### ESLint 配置 (.eslintrc.json)

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "prefer-const": "error",
    "no-var": "error",
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],
    "comma-dangle": ["error", "always-multiline"],
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "jsx-quotes": ["error", "prefer-double"]
  }
}
```

#### Prettier 配置 (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid"
}
```

## 📋 代码开发规范

### 1. 文件命名规范

```typescript
// 组件文件 - PascalCase
ProductCard.tsx;
UserProfile.tsx;
ShoppingCart.tsx;

// 页面文件 - kebab-case
product - detail.tsx;
user - dashboard.tsx;
order - history.tsx;

// 工具文件 - camelCase
formatPrice.ts;
validateEmail.ts;
apiClient.ts;

// 类型定义文件 - kebab-case
product - types.ts;
user - types.ts;
api - types.ts;

// 常量文件 - UPPER_SNAKE_CASE
API_ENDPOINTS.ts;
PAYMENT_METHODS.ts;
```

### 2. 代码结构规范

#### 组件结构模板

```typescript
/**
 * 商品卡片组件
 * 用于展示商品的基本信息，支持响应式设计
 *
 * @component
 * @example
 * <ProductCard product={productData} onAddToCart={handleAddToCart} />
 */

import React, { useState, useCallback } from 'react';
import { type Product } from '@/types/product-types';
import { formatPrice } from '@/lib/utils/formatPrice';

// 组件属性接口定义
interface ProductCardProps {
  /** 商品数据 */
  product: Product;
  /** 添加到购物车的回调函数 */
  onAddToCart?: (productId: string) => void;
  /** 是否显示在心愿单中 */
  isWishlisted?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

// 组件主体
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  isWishlisted = false,
  className = '',
}) => {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);

  // 事件处理函数
  const handleAddToCart = useCallback(async () => {
    if (!onAddToCart) return;

    setIsLoading(true);
    try {
      await onAddToCart(product.id);
    } catch (error) {
      console.error('添加到购物车失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [product.id, onAddToCart]);

  // 渲染函数
  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
      {/* 商品图片 */}
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        {/* 心愿单图标 */}
        {isWishlisted && (
          <div className="absolute top-2 right-2">
            <HeartIcon className="w-6 h-6 text-red-500 fill-current" />
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* 价格和按钮 */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(product.price, product.currency)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !product.inStock}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '添加中...' : '加入购物车'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 导出组件
export default ProductCard;
```

#### API 路由结构模板

```typescript
/**
 * 商品列表API
 * GET /api/products - 获取商品列表
 *
 * @route GET /api/products
 * @param {Object} searchParams - 查询参数
 * @param {string} searchParams.category - 商品分类
 * @param {string} searchParams.search - 搜索关键词
 * @param {number} searchParams.page - 页码
 * @param {number} searchParams.limit - 每页数量
 * @returns {Object} 商品列表和分页信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// 请求参数验证schema
const GetProductsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['price', 'name', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// API处理函数
export async function GET(request: NextRequest) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const params = GetProductsSchema.parse({
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // 构建查询条件
    const where = {
      AND: [
        // 分类筛选
        params.category ? { categoryId: params.category } : {},
        // 搜索筛选
        params.search
          ? {
              OR: [
                {
                  name: {
                    contains: params.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  description: {
                    contains: params.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {},
        // 只显示已发布的商品
        { published: true },
      ],
    };

    // 计算分页
    const skip = (params.page - 1) * params.limit;

    // 执行查询
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          images: { select: { url: true, alt: true }, take: 1 },
          reviews: { select: { rating: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    // 处理商品数据
    const formattedProducts = products.map(product => ({
      ...product,
      averageRating:
        product.reviews.length > 0
          ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
            product.reviews.length
          : 0,
      reviewCount: product.reviews.length,
    }));

    // 分页信息
    const pagination = {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
      hasNext: params.page < Math.ceil(total / params.limit),
      hasPrev: params.page > 1,
    };

    // 返回响应
    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination,
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);

    // 参数验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求参数无效', details: error.errors },
        { status: 400 },
      );
    }

    // 服务器错误
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 },
    );
  }
}
```

### 3. TypeScript 类型定义规范

```typescript
// types/product-types.ts

/**
 * 商品相关类型定义
 */

// 基础商品接口
export interface Product {
  /** 商品ID */
  id: string;
  /** 商品名称 */
  name: string;
  /** 商品描述 */
  description: string;
  /** 商品价格 */
  price: number;
  /** 货币代码 */
  currency: string;
  /** SKU编码 */
  sku: string;
  /** 是否有库存 */
  inStock: boolean;
  /** 库存数量 */
  stockQuantity: number;
  /** 商品图片 */
  images: ProductImage[];
  /** 商品分类 */
  category: ProductCategory;
  /** 商品标签 */
  tags: string[];
  /** 是否已发布 */
  published: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

// 商品图片接口
export interface ProductImage {
  /** 图片ID */
  id: string;
  /** 图片URL */
  url: string;
  /** 图片描述 */
  alt: string;
  /** 排序顺序 */
  order: number;
}

// 商品分类接口
export interface ProductCategory {
  /** 分类ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** 分类图标 */
  icon?: string;
  /** 父级分类ID */
  parentId?: string;
}

// 商品变体接口
export interface ProductVariant {
  /** 变体ID */
  id: string;
  /** 商品ID */
  productId: string;
  /** 变体名称 */
  name: string;
  /** 变体价格 */
  price: number;
  /** SKU编码 */
  sku: string;
  /** 库存数量 */
  stockQuantity: number;
  /** 变体属性 */
  attributes: VariantAttribute[];
}

// 变体属性接口
export interface VariantAttribute {
  /** 属性名称 */
  name: string;
  /** 属性值 */
  value: string;
}

// API响应类型
export interface ProductListResponse {
  /** 是否成功 */
  success: boolean;
  /** 商品数据 */
  data: Product[];
  /** 分页信息 */
  pagination: PaginationInfo;
}

// 分页信息类型
export interface PaginationInfo {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总数量 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

// 表单类型
export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  categoryId: string;
  tags: string[];
  images: File[];
}

// 联合类型
export type ProductStatus = 'draft' | 'published' | 'archived';
export type SortOrder = 'asc' | 'desc';
export type ProductSortBy = 'name' | 'price' | 'createdAt' | 'updatedAt';
```

## 📁 项目结构规范

### 标准目录结构

```
yoyo-mall/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面组
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (shop)/                   # 商店前台页面组
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── layout.tsx
│   ├── admin/                    # 管理后台
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   └── layout.tsx
│   ├── api/                      # API路由
│   │   ├── products/
│   │   ├── orders/
│   │   ├── users/
│   │   └── auth/
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
├── components/                   # 组件目录
│   ├── ui/                       # 基础UI组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── forms/                    # 表单组件
│   │   ├── ProductForm/
│   │   ├── CheckoutForm/
│   │   └── index.ts
│   ├── layout/                   # 布局组件
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Sidebar/
│   │   └── index.ts
│   └── features/                 # 功能组件
│       ├── ProductCard/
│       ├── ShoppingCart/
│       ├── OrderHistory/
│       └── index.ts
├── lib/                          # 工具库
│   ├── utils/                    # 通用工具
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   ├── auth.ts                   # 认证逻辑
│   ├── prisma.ts                 # 数据库客户端
│   ├── payment.ts                # 支付集成
│   └── i18n.ts                   # 国际化配置
├── hooks/                        # 自定义Hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── index.ts
├── store/                        # 状态管理
│   ├── authStore.ts
│   ├── cartStore.ts
│   ├── productStore.ts
│   └── index.ts
├── types/                        # TypeScript类型
│   ├── product-types.ts
│   ├── user-types.ts
│   ├── order-types.ts
│   └── api-types.ts
├── styles/                       # 样式文件
│   ├── components.css
│   └── utilities.css
├── public/                       # 静态资源
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── prisma/                       # 数据库模式
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── docs/                         # 项目文档
├── tests/                        # 测试文件
│   ├── __mocks__/
│   ├── components/
│   ├── api/
│   └── utils/
├── .env.example                  # 环境变量示例
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## 🔄 Git 工作流规范

### 1. 分支管理策略

```bash
# 主分支
main          # 生产环境分支，只接受来自release和hotfix的合并
develop       # 开发主分支，用于集成各个功能分支

# 功能分支
feature/      # 新功能开发分支
├── feature/user-authentication
├── feature/product-catalog
├── feature/shopping-cart
└── feature/payment-integration

# 发布分支
release/      # 发布准备分支
├── release/v1.0.0
└── release/v1.1.0

# 修复分支
hotfix/       # 紧急修复分支
├── hotfix/payment-bug
└── hotfix/security-patch
```

### 2. 提交信息规范

```bash
# 提交信息格式
<type>(<scope>): <subject>

<body>

<footer>

# 类型说明
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式化
refactor: 重构代码
test:     测试相关
chore:    构建工具或辅助工具的变动

# 示例
feat(auth): 添加用户登录功能

- 实现邮箱密码登录
- 添加表单验证
- 集成next-auth

Closes #123
```

### 3. 代码审查流程

```markdown
## Pull Request 模板

### 变更描述

简要描述本次变更的内容和目的

### 变更类型

- [ ] 新功能
- [ ] Bug修复
- [ ] 代码重构
- [ ] 文档更新
- [ ] 性能优化

### 测试情况

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成

### 检查清单

- [ ] 代码符合项目规范
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
- [ ] 考虑了向后兼容性

### 截图（如有UI变更）
```

## 🧪 质量保证流程

### 1. 代码质量检查

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "validate": "npm run type-check && npm run lint && npm run test",
    "prepare": "husky install"
  }
}
```

### 2. Git Hooks 配置

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx commitlint --edit $1
```

### 3. CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage

      - name: Build project
        run: npm run build
```

## 📊 性能监控规范

### 1. 关键指标监控

```typescript
// lib/analytics.ts
export const trackPerformance = {
  // Core Web Vitals
  LCP: (value: number) => {
    // Largest Contentful Paint
    if (value > 2500) console.warn('LCP过慢:', value);
  },

  FID: (value: number) => {
    // First Input Delay
    if (value > 100) console.warn('FID过慢:', value);
  },

  CLS: (value: number) => {
    // Cumulative Layout Shift
    if (value > 0.1) console.warn('CLS过高:', value);
  },

  // 自定义指标
  apiResponse: (endpoint: string, duration: number) => {
    if (duration > 1000) {
      console.warn(`API响应慢: ${endpoint} - ${duration}ms`);
    }
  },

  componentRender: (component: string, duration: number) => {
    if (duration > 16.67) {
      // 60fps
      console.warn(`组件渲染慢: ${component} - ${duration}ms`);
    }
  },
};
```

### 2. 错误监控配置

```typescript
// lib/error-monitoring.ts
export class ErrorMonitor {
  static logError(error: Error, context: string) {
    console.error(`[${context}]`, error);

    // 发送到监控服务
    if (process.env.NODE_ENV === 'production') {
      // Sentry or other error tracking service
    }
  }

  static logWarning(message: string, data?: any) {
    console.warn(message, data);
  }

  static logInfo(message: string, data?: any) {
    console.info(message, data);
  }
}
```

---

## 💡 使用指南

1. **项目初始化**: 按照文档配置所有必要的文件和工具
2. **开发流程**: 严格遵循Git工作流和代码规范
3. **质量保证**: 每次提交前运行验证脚本
4. **性能监控**: 持续关注关键指标，及时优化
5. **文档维护**: 保持文档的及时更新

_遵循这些规范将确保项目的高质量和可维护性。_
