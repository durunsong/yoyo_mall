/**
 * 商品详情页配置默认值与工具函数
 * 支撑后台可配置化与前台渲染的统一结构
 */

export type ShareChannelType =
  | 'facebook'
  | 'twitter'
  | 'pinterest'
  | 'email'
  | 'link'
  | 'whatsapp'
  | 'custom';

export interface ShareChannelConfig {
  /** 渠道唯一标识，便于前端渲染 key 与后台保存 */
  id: string;
  /** 渠道类型，用于快速匹配行为 */
  type: ShareChannelType;
  /** 前端展示名称 */
  label: string;
  /** 前端展示描述，可选 */
  description?: string;
  /** 对应图标 key（前端根据 key 映射具体图标） */
  icon: string;
  /** 品牌主色，用于按钮/圆形图标背景 */
  brandColor?: string;
  /** 是否启用该渠道 */
  enabled: boolean;
  /** 分享链接模板，可通过 {url}/{title}/{description}/{image} 占位 */
  urlTemplate?: string;
}

export interface ProductDetailShareConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  channels: ShareChannelConfig[];
}

export interface ProductDetailRecommendationsConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  /** 推荐商品数量上限 */
  limit: number;
}

export interface ProductDetailReviewsConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  /** 是否展示统计概览 */
  showSummary: boolean;
}

export interface ProductDetailConfig {
  share: ProductDetailShareConfig;
  recommendations: ProductDetailRecommendationsConfig;
  reviews: ProductDetailReviewsConfig;
}

const DEFAULT_SHARE_CHANNELS: ShareChannelConfig[] = [
  {
    id: 'facebook',
    type: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
    brandColor: '#1877F2',
    enabled: true,
    urlTemplate: 'https://www.facebook.com/sharer/sharer.php?u={url}',
  },
  {
    id: 'pinterest',
    type: 'pinterest',
    label: 'Pinterest',
    icon: 'pinterest',
    brandColor: '#E60023',
    enabled: true,
    urlTemplate: 'https://pinterest.com/pin/create/button/?url={url}&description={title}',
  },
  {
    id: 'twitter',
    type: 'twitter',
    label: 'X (Twitter)',
    icon: 'twitter',
    brandColor: '#1DA1F2',
    enabled: true,
    urlTemplate: 'https://twitter.com/intent/tweet?url={url}&text={title}',
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email',
    icon: 'mail',
    brandColor: '#2563EB',
    enabled: true,
    urlTemplate: 'mailto:?subject={title}&body={title}%0D%0A{url}',
  },
  {
    id: 'copy-link',
    type: 'link',
    label: '复制链接',
    icon: 'link',
    brandColor: '#10B981',
    enabled: true,
    urlTemplate: '{url}',
  },
];

export const defaultProductDetailConfig: ProductDetailConfig = {
  share: {
    enabled: true,
    title: '分享给好友',
    subtitle: '把这款好物推荐给你的朋友',
    channels: DEFAULT_SHARE_CHANNELS,
  },
  recommendations: {
    enabled: true,
    title: '相关推荐',
    subtitle: '你可能也喜欢这些商品',
    limit: 5,
  },
  reviews: {
    enabled: true,
    title: '用户评价',
    subtitle: '来自真实购买者的反馈',
    showSummary: true,
  },
};

/**
 * 规范化分享渠道配置
 */
function sanitizeChannels(channels?: unknown): ShareChannelConfig[] {
  if (!Array.isArray(channels) || channels.length === 0) {
    return DEFAULT_SHARE_CHANNELS;
  }

  const sanitized: ShareChannelConfig[] = [];

  channels.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const channel = item as Partial<ShareChannelConfig> & { type?: string };
    const fallback = DEFAULT_SHARE_CHANNELS.find(
      (defaultChannel) =>
        defaultChannel.id === channel.id || defaultChannel.type === channel.type,
    );

    const id =
      typeof channel.id === 'string' && channel.id.trim()
        ? channel.id.trim()
        : fallback?.id ?? `custom-${index}`;

    const type =
      (typeof channel.type === 'string' && channel.type.trim()
        ? channel.type.trim()
        : fallback?.type ?? 'custom') as ShareChannelType;

    const label =
      typeof channel.label === 'string' && channel.label.trim()
        ? channel.label.trim()
        : fallback?.label ?? '自定义分享';

    const icon =
      typeof channel.icon === 'string' && channel.icon.trim()
        ? channel.icon.trim()
        : fallback?.icon ?? 'share-2';

    const brandColor =
      typeof channel.brandColor === 'string' && channel.brandColor.trim()
        ? channel.brandColor.trim()
        : fallback?.brandColor;

    const enabled =
      typeof channel.enabled === 'boolean'
        ? channel.enabled
        : fallback?.enabled ?? true;

    const urlTemplate =
      typeof channel.urlTemplate === 'string' && channel.urlTemplate.trim()
        ? channel.urlTemplate.trim()
        : fallback?.urlTemplate;

    sanitized.push({
      id,
      type,
      label,
      description:
        typeof channel.description === 'string' ? channel.description.trim() : fallback?.description,
      icon,
      brandColor,
      enabled,
      urlTemplate,
    });
  });

  return sanitized.length > 0 ? sanitized : DEFAULT_SHARE_CHANNELS;
}

/**
 * 将任意输入转换为完整的商品详情配置
 */
export function normalizeProductDetailConfig(input?: unknown): ProductDetailConfig {
  const base: ProductDetailConfig = JSON.parse(JSON.stringify(defaultProductDetailConfig));

  if (!input || typeof input !== 'object') {
    return base;
  }

  const config = input as Partial<ProductDetailConfig> & {
    share?: Partial<ProductDetailShareConfig> & { channels?: unknown };
    recommendations?: Partial<ProductDetailRecommendationsConfig>;
    reviews?: Partial<ProductDetailReviewsConfig>;
  };

  if (config.share) {
    if (typeof config.share.enabled === 'boolean') {
      base.share.enabled = config.share.enabled;
    }
    if (typeof config.share.title === 'string' && config.share.title.trim()) {
      base.share.title = config.share.title.trim();
    }
    if (typeof config.share.subtitle === 'string') {
      base.share.subtitle = config.share.subtitle.trim();
    }

    base.share.channels = sanitizeChannels(config.share.channels);
  }

  if (config.recommendations) {
    if (typeof config.recommendations.enabled === 'boolean') {
      base.recommendations.enabled = config.recommendations.enabled;
    }
    if (
      typeof config.recommendations.title === 'string' &&
      config.recommendations.title.trim()
    ) {
      base.recommendations.title = config.recommendations.title.trim();
    }
    if (typeof config.recommendations.subtitle === 'string') {
      base.recommendations.subtitle = config.recommendations.subtitle.trim();
    }
    if (typeof config.recommendations.limit === 'number') {
      const limit = Math.max(1, Math.min(12, Math.floor(config.recommendations.limit)));
      base.recommendations.limit = limit;
    }
  }

  if (config.reviews) {
    if (typeof config.reviews.enabled === 'boolean') {
      base.reviews.enabled = config.reviews.enabled;
    }
    if (typeof config.reviews.title === 'string' && config.reviews.title.trim()) {
      base.reviews.title = config.reviews.title.trim();
    }
    if (typeof config.reviews.subtitle === 'string') {
      base.reviews.subtitle = config.reviews.subtitle.trim();
    }
    if (typeof config.reviews.showSummary === 'boolean') {
      base.reviews.showSummary = config.reviews.showSummary;
    }
  }

  return base;
}

/**
 * 用于写入数据库的配置（将非法结构纠正为规范结构）
 */
export function sanitizeProductDetailConfigForStorage(input?: unknown): ProductDetailConfig {
  return normalizeProductDetailConfig(input);
}


