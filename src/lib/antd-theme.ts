/**
 * Ant Design 主题配置
 * 定制化主题样式，与项目整体设计保持一致
 */

import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#1677ff', // 蓝色主题
    colorSuccess: '#52c41a', // 绿色
    colorWarning: '#faad14', // 橙色
    colorError: '#ff4d4f', // 红色
    colorInfo: '#1677ff', // 信息色

    // 字体
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // 阴影
    boxShadow:
      '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',

    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,

    // 网格
    screenXS: 480,
    screenSM: 576,
    screenMD: 768,
    screenLG: 992,
    screenXL: 1200,
    screenXXL: 1600,

    // 动画
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',
  },

  components: {
    // Button 组件样式
    Button: {
      borderRadius: 6,
      fontWeight: 500,
      paddingInline: 24,
      paddingBlock: 8,
    },

    // Card 组件样式
    Card: {
      borderRadius: 8,
      paddingLG: 24,
    },

    // Menu 组件样式
    Menu: {
      itemHeight: 40,
      itemBorderRadius: 6,
      fontSize: 14,
    },

    // Input 组件样式
    Input: {
      borderRadius: 6,
      paddingInline: 12,
    },

    // Layout 组件样式
    Layout: {
      headerBg: '#ffffff',
      headerPadding: '0 24px',
      headerHeight: 64,
      footerBg: '#f5f5f5',
    },

    // Typography 组件样式
    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: 16,
    },

    // Table 组件样式
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
    },

    // Form 组件样式
    Form: {
      labelHeight: 32,
      verticalLabelPadding: '0 0 8px',
    },

    // Modal 组件样式
    Modal: {
      borderRadius: 12,
      paddingLG: 32,
    },

    // Drawer 组件样式
    Drawer: {
      paddingLG: 24,
    },

    // Dropdown 组件样式
    Dropdown: {
      borderRadius: 8,
      paddingSM: 8,
    },

    // Badge 组件样式
    Badge: {
      fontSize: 12,
    },

    // Notification 组件样式
    Notification: {
      borderRadius: 8,
      paddingLG: 20,
    },

    // Message 组件样式
    Message: {
      borderRadius: 6,
    },

    // Steps 组件样式
    Steps: {
      titleLineHeight: 1.5,
      descriptionMaxWidth: 140,
    },

    // Tabs 组件样式
    Tabs: {
      titleFontSize: 14,
      cardPaddingSM: '8px 16px',
    },

    // Carousel 组件样式
    Carousel: {
      dotHeight: 8,
      dotWidth: 8,
      dotActiveWidth: 24,
    },
  },

  // 算法配置
  algorithm: undefined, // 可以使用 theme.darkAlgorithm 或 theme.compactAlgorithm
};

// 深色主题配置
export const darkTheme: ThemeConfig = {
  ...antdTheme,
  algorithm: undefined, // 在实际使用时可以导入 theme.darkAlgorithm
  token: {
    ...antdTheme.token,
    colorBgBase: '#141414',
    colorTextBase: '#ffffff',
  },
};

// 紧凑主题配置
export const compactTheme: ThemeConfig = {
  ...antdTheme,
  algorithm: undefined, // 在实际使用时可以导入 theme.compactAlgorithm
  token: {
    ...antdTheme.token,
    sizeUnit: 4,
    sizeStep: 4,
    wireframe: true,
  },
};
