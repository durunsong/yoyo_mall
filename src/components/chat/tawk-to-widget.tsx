/**
 * Tawk.to 在线客服组件
 * 集成 Tawk.to 实时客服功能
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToWidget() {
  const pathname = usePathname();

  useEffect(() => {
    // 在后台管理页面不加载客服组件
    if (pathname?.startsWith('/admin')) {
      console.log('后台页面,跳过客服加载');
      return;
    }

    // 从环境变量获取配置
    const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;
    const apiKey = process.env.NEXT_PUBLIC_TAWK_API_KEY;

    // 验证配置是否存在
    if (!widgetId || !apiKey) {
      console.warn('Tawk.to Widget ID 或 API Key 未配置');
      return;
    }

    // 防止重复加载
    if (window.Tawk_API) {
      return;
    }

    // 初始化 Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // 创建并加载 Tawk.to 脚本
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${widgetId}/${apiKey}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // 添加脚本到页面
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    // 可选: 监听 Tawk.to 事件
    window.Tawk_API.onLoad = function () {
      console.log('Tawk.to 客服已加载');
    };

    window.Tawk_API.onChatMaximized = function () {
      console.log('客服窗口已打开');
    };

    window.Tawk_API.onChatMinimized = function () {
      console.log('客服窗口已最小化');
    };

    // 清理函数
    return () => {
      // 移除脚本(如果需要)
      const tawkScript = document.querySelector(
        `script[src*="embed.tawk.to"]`
      );
      if (tawkScript) {
        tawkScript.remove();
      }

      // 清理全局对象
      if (window.Tawk_API) {
        window.Tawk_API = undefined;
      }
    };
  }, []);

  // 不渲染任何 DOM,Tawk.to 会自动注入客服组件
  return null;
}

/**
 * Tawk.to API 方法(可选)
 * 可以通过这些方法控制客服组件
 */
export const TawkToAPI = {
  // 显示客服窗口
  maximize: () => {
    if (window.Tawk_API) {
      window.Tawk_API.maximize();
    }
  },

  // 最小化客服窗口
  minimize: () => {
    if (window.Tawk_API) {
      window.Tawk_API.minimize();
    }
  },

  // 切换客服窗口
  toggle: () => {
    if (window.Tawk_API) {
      window.Tawk_API.toggle();
    }
  },

  // 隐藏客服组件
  hideWidget: () => {
    if (window.Tawk_API) {
      window.Tawk_API.hideWidget();
    }
  },

  // 显示客服组件
  showWidget: () => {
    if (window.Tawk_API) {
      window.Tawk_API.showWidget();
    }
  },

  // 设置用户属性(需要用户登录)
  setAttributes: (attributes: Record<string, any>) => {
    if (window.Tawk_API) {
      window.Tawk_API.setAttributes(attributes, (error: any) => {
        if (error) {
          console.error('设置用户属性失败:', error);
        }
      });
    }
  },

  // 添加标签
  addTags: (tags: string[]) => {
    if (window.Tawk_API) {
      window.Tawk_API.addTags(tags, (error: any) => {
        if (error) {
          console.error('添加标签失败:', error);
        }
      });
    }
  },
};



