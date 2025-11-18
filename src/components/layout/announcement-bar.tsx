'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useStaticTranslations } from '@/hooks/use-i18n';

type AnnouncementActionType = 'NONE' | 'URL' | 'OPEN_LOGIN_MODAL' | 'OPEN_REGISTER_MODAL';

interface AnnouncementItem {
  id: string;
  title: string | null;
  content: string | null;
  imageUrl: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  height: number | null;
  sortOrder: number;
  actionType: AnnouncementActionType;
  linkUrl: string | null;
  openInNewTab: boolean;
}

interface AnnouncementResponse {
  success: boolean;
  data: AnnouncementItem[];
  config?: {
    rotationInterval: number;
  } | null;
}

const DEFAULT_ROTATION_INTERVAL = 5000;

export function AnnouncementBar() {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { data: session } = useSession();
  const { t } = useStaticTranslations('layout');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [rotationInterval, setRotationInterval] = useState(DEFAULT_ROTATION_INTERVAL);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements?active=true&includeConfig=true', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data: AnnouncementResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(t('announcement.loadError'));
        }

        if (Array.isArray(data.data)) {
          setAnnouncements(data.data.sort((a, b) => a.sortOrder - b.sortOrder));
        }

        if (data.config?.rotationInterval) {
          setRotationInterval(data.config.rotationInterval);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error(t('announcement.loadError'), error);
      }
    };

    loadAnnouncements();

    return () => controller.abort();
  }, [t]);

  // 轮播定时器 - 添加平滑过渡效果
  useEffect(() => {
    if (announcements.length <= 1) {
      return;
    }

    const interval = rotationInterval >= 1000 ? rotationInterval : DEFAULT_ROTATION_INTERVAL;
    const timer = window.setInterval(() => {
      // 触发过渡动画
      setIsTransitioning(true);
      
      // 等待动画完成后再切换索引
      setTimeout(() => {
        // 先切换索引
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        
        // 使用 requestAnimationFrame 确保索引更新后再重置动画状态
        // 这样可以避免视觉跳跃
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(false);
          });
        });
      }, 500); // 动画持续时间 500ms
    }, interval);

    return () => window.clearInterval(timer);
  }, [announcements, rotationInterval]);

  const currentAnnouncement = announcements[currentIndex];

  const hasAnnouncements = announcements.length > 0 && currentAnnouncement;

  const lines = useMemo(() => {
    if (!currentAnnouncement?.content) return [];
    return currentAnnouncement.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [currentAnnouncement]);

  const handleClick = () => {
    if (!currentAnnouncement) return;

    if (currentAnnouncement.actionType === 'URL' && currentAnnouncement.linkUrl) {
      const url = currentAnnouncement.linkUrl.trim();
      if (!url) return;

      if (currentAnnouncement.openInNewTab) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          window.open(url, '_blank', 'noopener');
        } else {
          window.open(url, '_blank');
        }
        return;
      }

      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.location.href = url;
      } else {
        router.push(url);
      }
      return;
    }

    if (currentAnnouncement.actionType === 'OPEN_LOGIN_MODAL') {
      // 已登录用户无需再次弹出登录框
      if (session?.user) return;
      openModal('login');
      return;
    }

    if (currentAnnouncement.actionType === 'OPEN_REGISTER_MODAL') {
      // 已登录用户无需再次弹出注册框
      if (session?.user) return;
      openModal('register');
    }
  };

  if (!hasAnnouncements) {
    return null;
  }

  const height = currentAnnouncement?.height ?? 40;
  const background = currentAnnouncement?.backgroundColor || '#1D4ED8';
  const textColor = currentAnnouncement?.textColor || '#FFFFFF';
  const isClickable =
    currentAnnouncement?.actionType && currentAnnouncement.actionType !== 'NONE' &&
    (currentAnnouncement.actionType === 'URL' ? Boolean(currentAnnouncement.linkUrl?.trim()) : true);

  const containerStyles: CSSProperties = {
    backgroundColor: background,
    color: textColor,
    minHeight: height,
    display: 'flex',
    alignItems: 'center',
  };

  // 渲染内容节点
  const renderContent = (announcement: AnnouncementItem | undefined, key: string) => {
    if (!announcement) return null;
    
    const announcementLines = announcement.content
      ? announcement.content.split('\n').map((line) => line.trim()).filter(Boolean)
      : [];

    return (
      <div 
        key={key}
        className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3 px-4 text-center text-sm md:text-base"
      >
        {announcement.imageUrl ? (
          <img
            src={announcement.imageUrl}
            alt={announcement.title ?? t('announcement.defaultAlt')}
            className="max-h-10 w-auto object-contain"
          />
        ) : null}
        <div className="flex flex-col items-center justify-center gap-1">
          {announcement.title ? (
            <span className="font-semibold leading-tight">{announcement.title}</span>
          ) : null}
          {announcementLines.map((line, index) => (
            <span key={index} className="leading-tight">
              {line}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // 容器内容 - 支持轮播动画
  const contentNode = (
    <div className="relative w-full overflow-hidden">
      <div
        className={isTransitioning ? 'flex transition-transform duration-500 ease-in-out' : 'flex'}
        style={{
          transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        {/* 当前公告 */}
        <div className="min-w-full flex-shrink-0">
          {renderContent(currentAnnouncement, `current-${currentIndex}`)}
        </div>
        
        {/* 下一个公告（用于平滑过渡） */}
        {announcements.length > 1 && (
          <div className="min-w-full flex-shrink-0">
            {renderContent(
              announcements[(currentIndex + 1) % announcements.length],
              `next-${(currentIndex + 1) % announcements.length}`,
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-hidden" style={containerStyles}>
      {isClickable ? (
        <button
          type="button"
          onClick={handleClick}
          className="flex w-full items-center justify-center focus:outline-none"
          style={{ color: textColor }}
        >
          {contentNode}
        </button>
      ) : (
        contentNode
      )}
    </div>
  );
}

