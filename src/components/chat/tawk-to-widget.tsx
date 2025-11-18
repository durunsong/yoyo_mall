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

    // 添加CSS样式，在脚本加载前就隐藏Tawk.to widget
    const style = document.createElement('style');
    style.id = 'tawk-hide-style';
    style.textContent = `
      #tawkchat-container,
      .tawk-min-container,
      .tawk-button,
      iframe[src*="tawk.to"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);

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

    // 初始化 Tawk_API - 在加载前就配置为隐藏
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    
    // 在脚本加载前就设置为隐藏状态，避免加载时闪现
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: 'br',
          xOffset: 0,
          yOffset: 0,
        },
        mobile: {
          position: 'br',
          xOffset: 0,
          yOffset: 0,
        },
      },
    };

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
      
      // 始终隐藏 Tawk.to 的默认浮动图标
      // 只使用自定义的客服按钮
      window.Tawk_API.hideWidget();
    };

    window.Tawk_API.onChatMaximized = function () {
      console.log('客服窗口已打开');
      
      // 在桌面端添加点击外部关闭的功能
      if (window.innerWidth >= 768) {
        // 延迟添加监听器，避免立即触发
        setTimeout(() => {
          addClickOutsideListener();
        }, 100);
      }
    };

    window.Tawk_API.onChatMinimized = function () {
      console.log('客服窗口已最小化');
      // 移除点击外部监听器
      removeClickOutsideListener();
    };

    // 点击外部关闭客服窗口的处理函数
    const handleClickOutside = (event: MouseEvent) => {
      // 获取 Tawk.to iframe 元素
      const tawkIframe = document.getElementById('tawkchat-container') || 
                        document.querySelector('iframe[title*="chat"]') ||
                        document.querySelector('iframe[src*="tawk.to"]');
      
      if (!tawkIframe) return;

      // 检查点击是否在 iframe 外部
      const rect = tawkIframe.getBoundingClientRect();
      const clickX = event.clientX;
      const clickY = event.clientY;

      const isOutside = 
        clickX < rect.left ||
        clickX > rect.right ||
        clickY < rect.top ||
        clickY > rect.bottom;

      // 如果点击在外部，关闭客服窗口
      if (isOutside && window.Tawk_API) {
        window.Tawk_API.minimize();
      }
    };

    // 添加点击外部监听器
    const addClickOutsideListener = () => {
      document.addEventListener('click', handleClickOutside, true);
    };

    // 移除点击外部监听器
    const removeClickOutsideListener = () => {
      document.removeEventListener('click', handleClickOutside, true);
    };

    // 清理函数
    return () => {
      // 移除点击外部监听器
      removeClickOutsideListener();
      
      // 移除隐藏样式
      const hideStyle = document.getElementById('tawk-hide-style');
      if (hideStyle) {
        hideStyle.remove();
      }
      
      // 移除脚本(如果需要)
      const tawkScript = document.querySelector(
        'script[src*="embed.tawk.to"]',
      );
      if (tawkScript) {
        tawkScript.remove();
      }

      // 清理全局对象
      if (window.Tawk_API) {
        window.Tawk_API = undefined;
      }
    };
  }, [pathname]);

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



