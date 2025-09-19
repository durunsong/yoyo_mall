/**
 * 通用工具函数库
 * 包含项目中常用的工具函数
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并Tailwind CSS类名
 * @param inputs - 类名参数
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化价格显示
 * @param price - 价格数值
 * @param currency - 货币代码
 * @param locale - 地区代码
 * @returns 格式化后的价格字符串
 */
export function formatPrice(
  price: number | string,
  currency: string = 'USD',
  locale: string = 'en-US',
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(Number(price));
}

/**
 * 格式化日期显示
 * @param date - 日期对象或字符串
 * @param locale - 地区代码
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string, locale: string = 'zh-CN') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * 格式化相对时间
 * @param date - 日期对象或字符串
 * @param locale - 地区代码
 * @returns 相对时间字符串（如：2小时前）
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = 'zh-CN',
) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = (target.getTime() - now.getTime()) / 1000;

  const units: Array<[string, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffInSeconds) >= secondsInUnit) {
      return rtf.format(
        Math.round(diffInSeconds / secondsInUnit),
        unit as Intl.RelativeTimeFormatUnit,
      );
    }
  }

  return rtf.format(0, 'second');
}

/**
 * 生成URL友好的slug
 * @param text - 原始文本
 * @returns slug字符串
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * 生成唯一的订单号
 * @returns 订单号字符串
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * 计算折扣信息
 * @param originalPrice - 原价
 * @param discountedPrice - 折扣价
 * @returns 折扣金额和百分比
 */
export function calculateDiscount(
  originalPrice: number,
  discountedPrice: number,
): { amount: number; percentage: number } {
  const amount = originalPrice - discountedPrice;
  const percentage = Math.round((amount / originalPrice) * 100);
  return { amount, percentage };
}

/**
 * 截断文本
 * @param text - 原始文本
 * @param length - 最大长度
 * @returns 截断后的文本
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * 等待指定时间
 * @param ms - 毫秒数
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 深度克隆对象
 * @param obj - 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 移除对象中的空值
 * @param obj - 原始对象
 * @returns 移除空值后的对象
 */
export function removeEmptyValues<T extends Record<string, any>>(
  obj: T,
): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * 防抖函数
 * @param func - 要防抖的函数
 * @param wait - 等待时间
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 * @param func - 要节流的函数
 * @param limit - 时间限制
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否为有效邮箱
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 * @param phone - 手机号
 * @returns 是否为有效手机号
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 生成随机字符串
 * @param length - 字符串长度
 * @returns 随机字符串
 */
export function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
