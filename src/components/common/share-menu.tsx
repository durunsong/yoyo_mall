'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  ShareChannelConfig,
  ProductDetailShareConfig,
} from '@/lib/config/product-detail';
import { Popover, PopoverTrigger, PopoverContent, PopoverArrow } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Facebook,
  Twitter,
  Mail,
  Link as LinkIcon,
  MessageCircle,
  SendHorizonal,
  Share,
  Pin,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 分享渠道与图标组件的映射，方便后台通过 icon 字段控制前端展示
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  mail: Mail,
  email: Mail,
  link: LinkIcon,
  share: Share2,
  whatsapp: MessageCircle,
  telegram: SendHorizonal,
  copy: Copy,
  pinterest: Pin,
  pin: Pin,
};

// 根据配置中的 icon 关键字返回实际的图标组件
function getIconComponent(iconKey?: string) {
  if (!iconKey) return Share2;
  const lowerKey = iconKey.toLowerCase();
  return ICON_MAP[lowerKey] || ICON_MAP.pin || Share;
}

// 将模板中的占位符替换为真实数据，生成分享链接
function buildShareUrl(
  channel: ShareChannelConfig,
  {
    url,
    title,
    description,
    image,
  }: { url: string; title: string; description?: string; image?: string },
) {
  if (!channel.urlTemplate) return url;
  return channel.urlTemplate
    .replaceAll('{url}', encodeURIComponent(url))
    .replaceAll('{title}', encodeURIComponent(title))
    .replaceAll('{description}', encodeURIComponent(description ?? ''))
    .replaceAll('{image}', encodeURIComponent(image ?? ''));
}

// 粘贴板操作，若原生 API 不可用则回退到 execCommand
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (fallbackError) {
      console.error('复制失败:', fallbackError);
      return false;
    }
  }
}

export interface ShareMenuProps {
  shareConfig: ProductDetailShareConfig;
  url: string;
  title: string;
  description?: string;
  image?: string;
  trigger?: React.ReactNode;
  className?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  messages?: Partial<ShareMenuMessages>;
}

interface ShareMenuMessages {
  defaultShareLabel: string;
  copySuccess: string;
  copyFailed: string;
}

const DEFAULT_MESSAGES: ShareMenuMessages = {
  defaultShareLabel: '分享',
  copySuccess: '链接已复制到剪贴板',
  copyFailed: '复制失败，请手动复制',
};

/**
 * 通用的分享弹层组件，可在商品详情等页面复用
 */
export function ShareMenu({
  shareConfig,
  url,
  title,
  description,
  image,
  trigger,
  className,
  buttonVariant = 'outline',
  messages,
}: ShareMenuProps) {
  const mergedMessages = { ...DEFAULT_MESSAGES, ...messages };
  const { copySuccess, copyFailed } = mergedMessages;
  const effectiveUrl =
    url || (typeof window !== 'undefined' ? window.location.href : '');
  const availableChannels = shareConfig.channels.filter((channel) => channel.enabled);

  // 不同渠道的点击回调，支持复制链接、邮件、第三方跳转等场景
  const handleChannelClick = useCallback(
    async (channel: ShareChannelConfig) => {
      if (channel.type === 'link') {
        const success = await copyToClipboard(effectiveUrl);
        if (success) {
          toast.success(copySuccess);
        } else {
          toast.error(copyFailed);
        }
        return;
      }

      if (channel.type === 'custom' && navigator.share) {
        try {
          await navigator.share({ title, text: description, url: effectiveUrl });
          return;
        } catch (error) {
          console.warn('系统分享取消或失败:', error);
        }
      }

      const shareUrl = buildShareUrl(channel, {
        url: effectiveUrl,
        title,
        description,
        image,
      });

      if (channel.type === 'email') {
        window.location.href = shareUrl;
      } else {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      }
    },
    [effectiveUrl, title, description, image, copySuccess, copyFailed],
  );

  if (!shareConfig.enabled || availableChannels.length === 0) {
    return null;
  }

  // 默认触发按钮：在未自定义 trigger 时使用
  const defaultTrigger = (
    <Button
      size="lg"
      variant={buttonVariant}
      className={cn('flex items-center gap-2', className)}
    >
      <Share2 className="h-5 w-5" />
      {mergedMessages.defaultShareLabel}
    </Button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{shareConfig.title}</p>
            {shareConfig.subtitle && (
              <p className="mt-1 text-xs text-gray-500">{shareConfig.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {availableChannels.map((channel) => {
              const IconComponent = getIconComponent(channel.icon);
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => handleChannelClick(channel)}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: channel.brandColor ?? '#3B82F6' }}
                  aria-label={channel.label}
                >
                  <IconComponent className="h-5 w-5" />
                </button>
              );
            })}
          </div>

          {/* 一键复制当前链接 */}
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2 overflow-hidden text-ellipsis px-0 text-sm text-gray-500 hover:text-gray-900"
            onClick={async () => {
              const success = await copyToClipboard(effectiveUrl);
              if (success) {
                toast.success(copySuccess);
              } else {
                toast.error(copyFailed);
              }
            }}
          >
            <Copy className="h-4 w-4 text-gray-400" />
            <span className="truncate">{effectiveUrl}</span>
          </Button>
        </div>
        <PopoverArrow className="h-3 w-6" />
      </PopoverContent>
    </Popover>
  );
}

export default ShareMenu;

