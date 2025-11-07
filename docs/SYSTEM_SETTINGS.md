# 系统设置功能文档

## 概述

系统设置功能允许管理员在后台配置网站的各项参数，这些设置会影响整个网站的行为和显示。

## 功能模块

### 1. 网站基本信息
- **网站名称**: 显示在网站标题、邮件等位置
- **网站描述**: 用于SEO和网站介绍
- **网站地址**: 网站的主域名
- **联系邮箱**: 客服联系邮箱
- **联系电话**: 客服联系电话
- **默认语言**: 网站默认显示语言（zh-CN/en-US）
- **默认货币**: 网站默认货币（CNY/USD/EUR等）

### 2. 支付设置
- **Stripe**: 国际信用卡支付
  - 启用/禁用
  - Public Key
  - Secret Key
- **支付宝**: 国内支付
  - 启用/禁用
  - App ID
  - Private Key
- **微信支付**: 国内支付
  - 启用/禁用
  - Merchant ID
  - API Key

### 3. 邮件设置
- **SMTP配置**
  - 主机地址
  - 端口（默认587）
  - 用户名
  - 密码
  - 是否启用SSL
- **发件人信息**
  - 发件人邮箱
  - 发件人名称

### 4. 通知设置
- **订单通知**: 接收新订单通知
- **用户通知**: 接收新用户注册通知
- **库存警报**: 库存低于阈值时通知
- **邮件通知**: 通过邮件发送通知
- **短信通知**: 通过短信发送通知

### 5. 公告管理
- 可创建多条公告，轮播显示
- 支持自定义背景色、文字色、高度
- 支持点击跳转或打开登录/注册弹窗

## API接口

### 后台接口（需要管理员权限）

#### 获取所有设置
```http
GET /api/admin/settings
Authorization: Required (Admin/SuperAdmin)

Response:
{
  "success": true,
  "data": {
    "siteName": "Yobuy",
    "siteDescription": "...",
    "defaultCurrency": "CNY",
    // ... 所有设置字段
  }
}
```

#### 更新设置（支持部分更新）
```http
PUT /api/admin/settings
Authorization: Required (Admin/SuperAdmin)
Content-Type: application/json

Body:
{
  "defaultCurrency": "USD",  // 只更新这一个字段
  "stripeEnabled": true
}

Response:
{
  "success": true,
  "data": { /* 完整设置 */ },
  "message": "系统设置已保存"
}
```

### 前台接口（公开）

#### 获取公开设置
```http
GET /api/settings

Response:
{
  "success": true,
  "data": {
    "siteName": "Yobuy",
    "defaultCurrency": "CNY",
    "stripeEnabled": true,
    // 只包含公开字段，不包含密钥等敏感信息
  }
}
```

## 前台使用示例

### 1. 使用Hook获取设置

```tsx
import { useSystemSettings, getCurrencySymbol } from '@/hooks/use-system-settings';

function ProductCard({ product }) {
  const { settings } = useSystemSettings();
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p className="price">
        {currencySymbol}{product.price.toFixed(2)}
      </p>
    </div>
  );
}
```

### 2. 使用Price组件

```tsx
import { Price } from '@/components/common/price';

function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <Price 
        amount={product.price} 
        showOriginal={true}
        originalAmount={product.comparePrice}
      />
    </div>
  );
}
```

### 3. 格式化价格函数

```tsx
import { formatPrice } from '@/hooks/use-system-settings';

const priceText = formatPrice(99.99); // 输出: "¥99.99" 或 "$99.99"
```

## 货币符号映射

系统支持以下货币：

| 货币代码 | 货币名称 | 符号 |
|---------|---------|------|
| CNY | 人民币 | ¥ |
| USD | 美元 | $ |
| EUR | 欧元 | € |
| GBP | 英镑 | £ |
| JPY | 日元 | ¥ |
| KRW | 韩元 | ₩ |
| HKD | 港币 | HK$ |
| TWD | 新台币 | NT$ |

## 数据存储

所有设置存储在 `system_settings` 表中，只有一条记录（ID为"global"）。

### 数据库Schema

```prisma
model SystemSettings {
  id              String   @id @default("global")
  
  // 网站基本信息
  siteName        String   @default("Yobuy")
  siteDescription String?
  siteUrl         String?
  contactEmail    String?
  contactPhone    String?
  defaultLanguage String   @default("zh-CN")
  defaultCurrency String   @default("CNY")
  
  // 支付设置
  stripeEnabled      Boolean @default(false)
  stripePublicKey    String?
  stripeSecretKey    String?
  alipayEnabled      Boolean @default(false)
  alipayAppId        String?
  alipayPrivateKey   String?
  wechatPayEnabled   Boolean @default(false)
  wechatPayMchId     String?
  wechatPayApiKey    String?
  
  // 邮件设置
  smtpHost           String?
  smtpPort           Int?    @default(587)
  smtpUser           String?
  smtpPassword       String?
  smtpSecure         Boolean @default(false)
  emailFrom          String?
  emailFromName      String?
  
  // 通知设置
  orderNotifications     Boolean @default(true)
  userNotifications      Boolean @default(true)
  inventoryAlerts        Boolean @default(true)
  emailNotifications     Boolean @default(true)
  smsNotifications       Boolean @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("system_settings")
}
```

## 工作流程

### 后台设置流程

1. 管理员登录后台
2. 进入"系统设置"页面
3. 选择对应的Tab（网站设置/支付设置/邮件设置/通知设置）
4. 修改配置项
5. 点击"保存设置"按钮
6. 系统调用 `PUT /api/admin/settings` API
7. 数据保存到数据库

### 前台使用流程

1. 页面加载时，`useSystemSettings` Hook自动调用 `GET /api/settings`
2. 获取公开的系统设置（包括默认货币等）
3. 将设置存储在Zustand store中
4. 组件通过Hook获取设置
5. 根据设置显示对应的货币符号

### 货币切换流程

1. 管理员在后台将"默认货币"从"CNY"改为"USD"
2. 点击保存，数据更新到数据库
3. 前台用户刷新页面或新访问
4. `useSystemSettings` Hook获取新的设置
5. 所有使用了货币显示的组件自动更新为 `$` 符号

## 注意事项

1. **敏感信息保护**: 前台API不会返回支付密钥、邮箱密码等敏感信息
2. **权限控制**: 只有管理员和超级管理员可以修改设置
3. **缓存策略**: 系统设置会在客户端缓存，除非手动刷新
4. **部分更新**: API支持部分字段更新，不需要每次都传所有字段
5. **默认值**: 如果某些字段未设置，会使用预定义的默认值

## 扩展指南

### 添加新的设置字段

1. 在 `prisma/schema.prisma` 中添加字段
2. 运行 `npx prisma migrate dev --name add_new_field`
3. 在 `src/app/api/admin/settings/route.ts` 的PUT方法中添加字段处理
4. 在 `src/app/admin/settings/page.tsx` 中添加UI控件
5. 如果需要前台访问，在 `src/app/api/settings/route.ts` 中添加到select列表

### 添加新的货币

在 `src/hooks/use-system-settings.ts` 的 `getCurrencySymbol` 函数中添加映射：

```tsx
const currencyMap: Record<string, string> = {
  // ... 现有货币
  'AUD': 'A$',  // 添加澳元
};
```

## 故障排除

### 设置保存失败
- 检查是否有管理员权限
- 查看浏览器控制台错误信息
- 检查网络请求状态

### 前台货币符号不更新
- 刷新页面重新加载设置
- 检查 `useSystemSettings` Hook是否正确使用
- 查看控制台是否有API调用错误

### 邮件发送失败
- 验证SMTP配置是否正确
- 检查防火墙是否阻止SMTP端口
- 确认SMTP服务器支持所选的加密方式

