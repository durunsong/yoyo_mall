/**
 * 首页配置类型定义
 * 支持多种模块类型，每种模块可独立配置
 */

// 轮播图配置
export interface BannerConfig {
  id: string;
  image: string;
  mobileImage?: string; // 移动端专用图片
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
  textColor?: string; // 文字颜色
  textPosition?: 'left' | 'center' | 'right';
  order: number;
  enabled: boolean;
}

// 分类导航配置
export interface CategoryNavConfig {
  id: string;
  categoryId: string;
  categoryName: string;
  icon?: string;
  image?: string;
  link?: string;
  order: number;
  enabled: boolean;
}

// 商品模块配置
export interface ProductSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: 'featured' | 'new' | 'bestseller' | 'deals' | 'category' | 'custom';
  categoryId?: string; // 如果type是category
  productIds?: string[]; // 如果type是custom
  limit: number;
  layout: 'grid' | 'slider' | 'list';
  columns: 2 | 3 | 4 | 5 | 6; // 网格列数
  showPrice: boolean;
  showRating: boolean;
  order: number;
  enabled: boolean;
  backgroundColor?: string;
}

// 促销横幅配置
export interface PromoBannerConfig {
  id: string;
  title: string;
  description?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  link?: string;
  buttonText?: string;
  type: 'full' | 'half' | 'quarter'; // 宽度类型
  order: number;
  enabled: boolean;
  startDate?: string;
  endDate?: string;
}

// 品牌展示配置
export interface BrandShowcaseConfig {
  id: string;
  title: string;
  brandIds: string[];
  layout: 'grid' | 'slider';
  showLogo: boolean;
  order: number;
  enabled: boolean;
}

// 内容卡片配置（类似Temu的信息卡片）
export interface ContentCardConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  link?: string;
  type: 'info' | 'feature' | 'service';
  order: number;
  enabled: boolean;
}

// 首页配置主结构
export interface HomePageConfig {
  id: string;
  name: string; // 配置名称，如"默认配置"、"促销配置"
  isActive: boolean; // 是否启用
  modules: HomePageModule[];
  createdAt: Date;
  updatedAt: Date;
}

// 首页模块（支持所有类型）
export interface HomePageModule {
  id: string;
  type: 'banner' | 'category-nav' | 'product-section' | 'promo-banner' | 'brand-showcase' | 'content-cards';
  order: number;
  enabled: boolean;
  config: BannerConfig[] | CategoryNavConfig[] | ProductSectionConfig | PromoBannerConfig | BrandShowcaseConfig | ContentCardConfig[];
}

// API响应类型
export interface HomePageConfigResponse {
  success: boolean;
  data?: HomePageConfig;
  error?: string;
}

// 默认配置模板
export const DEFAULT_HOME_CONFIG: Partial<HomePageConfig> = {
  name: '默认首页配置',
  isActive: true,
  modules: [
    {
      id: '1',
      type: 'banner',
      order: 1,
      enabled: true,
      config: [],
    },
    {
      id: '2',
      type: 'category-nav',
      order: 2,
      enabled: true,
      config: [],
    },
    {
      id: '3',
      type: 'product-section',
      order: 3,
      enabled: true,
      config: {
        id: '3',
        title: '热门商品',
        type: 'featured',
        limit: 10,
        layout: 'grid',
        columns: 5,
        showPrice: true,
        showRating: true,
        order: 3,
        enabled: true,
      } as ProductSectionConfig,
    },
  ],
};

