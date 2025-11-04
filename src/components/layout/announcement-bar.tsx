"use client";

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthModal } from '@/hooks/use-auth-modal';

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
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [rotationInterval, setRotationInterval] = useState(DEFAULT_ROTATION_INTERVAL);
  const [currentIndex, setCurrentIndex] = useState(0);

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
          throw new Error('加载公告失败');
        }

        if (Array.isArray(data.data)) {
          setAnnouncements(data.data.sort((a, b) => a.sortOrder - b.sortOrder));
        }

        if (data.config?.rotationInterval) {
          setRotationInterval(data.config.rotationInterval);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('加载公告失败:', error);
      }
    };

    loadAnnouncements();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) {
      return;
    }

    const interval = rotationInterval >= 1000 ? rotationInterval : DEFAULT_ROTATION_INTERVAL;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
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

  const contentNode = (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3 px-4 text-center text-sm md:text-base">
      {currentAnnouncement?.imageUrl ? (
        <img
          src={currentAnnouncement.imageUrl}
          alt={currentAnnouncement.title ?? '公告'}
          className="max-h-10 w-auto object-contain"
        />
      ) : null}
      <div className="flex flex-col items-center justify-center gap-1">
        {currentAnnouncement?.title ? (
          <span className="font-semibold leading-tight">{currentAnnouncement.title}</span>
        ) : null}
        {lines.map((line, index) => (
          <span key={index} className="leading-tight">
            {line}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full" style={containerStyles}>
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

