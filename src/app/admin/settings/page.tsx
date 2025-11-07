/**
 * 系统设置页面
 * 提供网站配置、支付设置、邮件设置等功能
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  CreditCard,
  Mail,
  Globe,
  Shield,
  Bell,
  Loader2,
  Save,
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ProductDetailConfig,
  ShareChannelConfig,
  ShareChannelType,
  defaultProductDetailConfig,
  normalizeProductDetailConfig,
  sanitizeProductDetailConfigForStorage,
} from '@/lib/config/product-detail';
import { v4 as uuidv4 } from 'uuid';

type AnnouncementActionType = 'NONE' | 'URL' | 'OPEN_LOGIN_MODAL' | 'OPEN_REGISTER_MODAL';

interface AnnouncementItem {
  id: string;
  title: string | null;
  content: string | null;
  imageUrl: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  height: number | null;
  isActive: boolean;
  sortOrder: number;
  actionType: AnnouncementActionType;
  linkUrl: string | null;
  openInNewTab: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementFormState {
  title: string;
  content: string;
  imageUrl: string;
  backgroundColor: string;
  textColor: string;
  height: string;
  isActive: boolean;
  sortOrder: string;
  actionType: AnnouncementActionType;
  linkUrl: string;
  openInNewTab: boolean;
}

const ANNOUNCEMENT_ACTION_LABELS: Record<AnnouncementActionType, string> = {
  NONE: '无操作',
  URL: '跳转链接',
  OPEN_LOGIN_MODAL: '打开登录弹窗',
  OPEN_REGISTER_MODAL: '打开注册弹窗',
};

const SHARE_TYPE_OPTIONS: { label: string; value: ShareChannelType }[] = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Pinterest', value: 'pinterest' },
  { label: 'Twitter / X', value: 'twitter' },
  { label: '邮件', value: 'email' },
  { label: '复制链接', value: 'link' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: '自定义', value: 'custom' },
];

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);

  // 网站基本设置
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'YoYo Mall',
    siteDescription: '您的跨境电商平台',
    siteUrl: 'https://yoyomall.com',
    contactEmail: 'support@yoyomall.com',
    contactPhone: '+86 400-123-4567',
    defaultLanguage: 'zh-CN',
    defaultCurrency: 'CNY',
  });

  // 支付设置
  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    alipayEnabled: false,
    alipayAppId: '',
    alipayPrivateKey: '',
    wechatPayEnabled: false,
    wechatPayMchId: '',
    wechatPayApiKey: '',
  });

  // 邮件设置
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
    emailFrom: '',
    emailFromName: '',
  });

  // 通知设置
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    userNotifications: true,
    inventoryAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  // 商品详情页配置
  const [productDetailConfig, setProductDetailConfig] = useState<ProductDetailConfig>(
    () => normalizeProductDetailConfig(defaultProductDetailConfig),
  );
  const [productConfigSaving, setProductConfigSaving] = useState(false);

  const announcementDefaultForm = useMemo<AnnouncementFormState>(
    () => ({
      title: '',
      content: '',
      imageUrl: '',
      backgroundColor: '#1D4ED8',
      textColor: '#FFFFFF',
      height: '48',
      isActive: true,
      sortOrder: '0',
      actionType: 'NONE',
      linkUrl: '',
      openInNewTab: false,
    }),
    [],
  );
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementFormState>(announcementDefaultForm);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementConfig, setAnnouncementConfig] = useState<{ rotationInterval: number }>({ rotationInterval: 5000 });
  const [announcementConfigSaving, setAnnouncementConfigSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const announcementActionOptions: { label: string; value: AnnouncementActionType }[] = [
    { label: '无操作', value: 'NONE' },
    { label: '跳转链接', value: 'URL' },
    { label: '打开登录弹窗', value: 'OPEN_LOGIN_MODAL' },
    { label: '打开注册弹窗', value: 'OPEN_REGISTER_MODAL' },
  ];

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementLoading(true);
      const response = await fetch('/api/announcements?includeConfig=true');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || '获取公告失败');
      }

      setAnnouncements(data.data ?? []);
      if (data.config?.rotationInterval) {
        setAnnouncementConfig({ rotationInterval: data.config.rotationInterval });
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : '获取公告失败');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchSystemSettings();
  }, []);

  // 加载系统设置
  const fetchSystemSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || '获取系统设置失败');
      }

      if (data.data) {
        // 网站基本信息
        setSiteSettings({
          siteName: data.data.siteName || 'YoYo Mall',
          siteDescription: data.data.siteDescription || '',
          siteUrl: data.data.siteUrl || '',
          contactEmail: data.data.contactEmail || '',
          contactPhone: data.data.contactPhone || '',
          defaultLanguage: data.data.defaultLanguage || 'zh-CN',
          defaultCurrency: data.data.defaultCurrency || 'CNY',
        });
        
        // 支付设置
        setPaymentSettings({
          stripeEnabled: data.data.stripeEnabled || false,
          stripePublicKey: data.data.stripePublicKey || '',
          stripeSecretKey: data.data.stripeSecretKey || '',
          alipayEnabled: data.data.alipayEnabled || false,
          alipayAppId: data.data.alipayAppId || '',
          alipayPrivateKey: data.data.alipayPrivateKey || '',
          wechatPayEnabled: data.data.wechatPayEnabled || false,
          wechatPayMchId: data.data.wechatPayMchId || '',
          wechatPayApiKey: data.data.wechatPayApiKey || '',
        });
        
        // 邮件设置
        setEmailSettings({
          smtpHost: data.data.smtpHost || '',
          smtpPort: data.data.smtpPort?.toString() || '587',
          smtpUser: data.data.smtpUser || '',
          smtpPassword: data.data.smtpPassword || '',
          smtpSecure: data.data.smtpSecure || false,
          emailFrom: data.data.emailFrom || '',
          emailFromName: data.data.emailFromName || '',
        });
        
        // 通知设置
        setNotificationSettings({
          orderNotifications: data.data.orderNotifications !== undefined ? data.data.orderNotifications : true,
          userNotifications: data.data.userNotifications !== undefined ? data.data.userNotifications : true,
          inventoryAlerts: data.data.inventoryAlerts !== undefined ? data.data.inventoryAlerts : true,
          emailNotifications: data.data.emailNotifications !== undefined ? data.data.emailNotifications : true,
          smsNotifications: data.data.smsNotifications || false,
        });

        // 商品详情配置
        setProductDetailConfig(
          normalizeProductDetailConfig(data.data.productDetailConfig),
        );
      }
    } catch (error) {
      console.error('获取系统设置失败:', error);
      toast.error(error instanceof Error ? error.message : '获取系统设置失败');
    } finally {
      setSettingsLoading(false);
    }
  };

  const resetAnnouncementForm = (nextSortOrder?: string) => {
    setAnnouncementForm({
      ...announcementDefaultForm,
      sortOrder: nextSortOrder ?? String((announcements.length + 1) * 10),
    });
  };

  const openCreateAnnouncement = () => {
    setEditingAnnouncementId(null);
    resetAnnouncementForm();
    setAnnouncementDialogOpen(true);
  };

  const openEditAnnouncement = (item: AnnouncementItem) => {
    setEditingAnnouncementId(item.id);
    setAnnouncementForm({
      title: item.title ?? '',
      content: item.content ?? '',
      imageUrl: item.imageUrl ?? '',
      backgroundColor: item.backgroundColor ?? '',
      textColor: item.textColor ?? '',
      height: item.height !== null && item.height !== undefined ? String(item.height) : '',
      isActive: item.isActive,
      sortOrder: String(item.sortOrder),
      actionType: item.actionType,
      linkUrl: item.linkUrl ?? '',
      openInNewTab: item.openInNewTab,
    });
    setAnnouncementDialogOpen(true);
  };

  const closeAnnouncementDialog = (open: boolean) => {
    setAnnouncementDialogOpen(open);
    if (!open) {
      setEditingAnnouncementId(null);
      resetAnnouncementForm('0');
    }
  };

  const updateAnnouncement = async (
    id: string,
    payload: Record<string, unknown>,
    successMessage = '公告已更新',
  ) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || '更新失败');
      }

      toast.success(successMessage);
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handleAnnouncementSubmit = async () => {
    try {
      setAnnouncementSaving(true);

      const heightNumber = announcementForm.height.trim()
        ? Number(announcementForm.height.trim())
        : undefined;
      const sortOrderNumber = announcementForm.sortOrder.trim()
        ? Number(announcementForm.sortOrder.trim())
        : 0;

      if (heightNumber !== undefined && Number.isNaN(heightNumber)) {
        throw new Error('请填写正确的高度（数字）');
      }

      if (Number.isNaN(sortOrderNumber)) {
        throw new Error('请填写正确的排序值（数字）');
      }

      const payload = {
        title: announcementForm.title.trim() || null,
        content: announcementForm.content.trim() || null,
        imageUrl: announcementForm.imageUrl.trim() || null,
        backgroundColor: announcementForm.backgroundColor.trim() || null,
        textColor: announcementForm.textColor.trim() || null,
        height: heightNumber,
        isActive: announcementForm.isActive,
        sortOrder: sortOrderNumber,
        actionType: announcementForm.actionType,
        linkUrl:
          announcementForm.actionType === 'URL'
            ? announcementForm.linkUrl.trim() || null
            : null,
        openInNewTab:
          announcementForm.actionType === 'URL' ? announcementForm.openInNewTab : false,
      };

      const url = editingAnnouncementId
        ? `/api/announcements/${editingAnnouncementId}`
        : '/api/announcements';
      const method = editingAnnouncementId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || '保存失败');
      }

      toast.success(editingAnnouncementId ? '公告已更新' : '公告已创建');
      closeAnnouncementDialog(false);
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleAnnouncementDelete = async (id: string) => {
    if (!window.confirm('确定要删除该公告吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || '删除失败');
      }

      toast.success('公告已删除');
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleToggleAnnouncement = (item: AnnouncementItem) => {
    updateAnnouncement(item.id, { isActive: !item.isActive }, '公告状态已更新');
  };

  const handleSortOrderBlur = (item: AnnouncementItem, value: string) => {
    if (!value.trim()) {
      toast.error('排序值不能为空');
      return;
    }
    const parsed = Number(value.trim());
    if (Number.isNaN(parsed)) {
      toast.error('请填写数字类型的排序值');
      return;
    }
    if (parsed === item.sortOrder) {
      return;
    }

    updateAnnouncement(item.id, { sortOrder: parsed }, '排序已更新');
  };

  const handleSaveAnnouncementConfig = async () => {
    try {
      setAnnouncementConfigSaving(true);
      const response = await fetch('/api/announcements/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotationInterval: announcementConfig.rotationInterval }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || '保存轮播配置失败');
      }
      toast.success('轮播设置已保存');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setAnnouncementConfigSaving(false);
    }
  };

  // 保存网站设置
  const handleSaveSiteSettings = async () => {
    try {
      setSaving(true);

      // 验证必填字段
      if (!siteSettings.siteName.trim()) {
        toast.error('网站名称不能为空');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || '保存失败');
      }

      toast.success('网站设置已保存');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存支付设置
  const handleSavePaymentSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || '保存失败');
      }

      toast.success('支付设置已保存');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存邮件设置
  const handleSaveEmailSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailSettings,
          smtpPort: parseInt(emailSettings.smtpPort) || 587,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || '保存失败');
      }

      toast.success('邮件设置已保存');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存通知设置
  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || '保存失败');
      }

      toast.success('通知设置已保存');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 商品详情页配置 - 更新分享基础字段
  const updateShareConfig = (key: keyof ProductDetailConfig['share'], value: any) => {
    setProductDetailConfig((prev) => ({
      ...prev,
      share: {
        ...prev.share,
        [key]: value,
      },
    }));
  };

  // 分享渠道编辑
  const handleShareChannelChange = <K extends keyof ShareChannelConfig>(
    channelId: string,
    key: K,
    value: ShareChannelConfig[K],
  ) => {
    setProductDetailConfig((prev) => ({
      ...prev,
      share: {
        ...prev.share,
        channels: prev.share.channels.map((channel) =>
          channel.id === channelId ? { ...channel, [key]: value } : channel,
        ),
      },
    }));
  };

  const handleAddShareChannel = () => {
    const newChannel: ShareChannelConfig = {
      id: uuidv4(),
      type: 'custom',
      label: '自定义渠道',
      icon: 'share-2',
      brandColor: '#3B82F6',
      enabled: true,
      urlTemplate: '',
    };

    setProductDetailConfig((prev) => ({
      ...prev,
      share: {
        ...prev.share,
        channels: [...prev.share.channels, newChannel],
      },
    }));
  };

  const handleRemoveShareChannel = (channelId: string) => {
    setProductDetailConfig((prev) => {
      if (prev.share.channels.length <= 1) {
        toast.error('至少保留一个分享渠道');
        return prev;
      }

      return {
        ...prev,
        share: {
          ...prev.share,
          channels: prev.share.channels.filter((channel) => channel.id !== channelId),
        },
      };
    });
  };

  const handleSaveProductDetailConfig = async () => {
    try {
      setProductConfigSaving(true);

      const payload = sanitizeProductDetailConfigForStorage(productDetailConfig);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDetailConfig: payload }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || '保存失败');
      }

      if (data.data?.productDetailConfig) {
        setProductDetailConfig(
          normalizeProductDetailConfig(data.data.productDetailConfig),
        );
      }

      toast.success('商品详情设置已保存');
    } catch (error) {
      console.error('保存商品详情设置失败:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setProductConfigSaving(false);
    }
  };

  const updateRecommendationsConfig = (
    key: keyof ProductDetailConfig['recommendations'],
    value: any,
  ) => {
    setProductDetailConfig((prev) => ({
      ...prev,
      recommendations: {
        ...prev.recommendations,
        [key]: value,
      },
    }));
  };

  const updateReviewsConfig = (
    key: keyof ProductDetailConfig['reviews'],
    value: any,
  ) => {
    setProductDetailConfig((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        [key]: value,
      },
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600 mt-1">配置网站参数和系统选项</p>
        </div>

        {/* 设置标签页 */}
        <Tabs defaultValue="site" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="site">
              <Globe className="mr-2 h-4 w-4" />
              网站设置
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="mr-2 h-4 w-4" />
              支付设置
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              邮件设置
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              通知设置
            </TabsTrigger>
            <TabsTrigger value="product-detail">
              <Sparkles className="mr-2 h-4 w-4" />
              商详配置
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="mr-2 h-4 w-4" />
              公告管理
            </TabsTrigger>
          </TabsList>

          {/* 网站设置 */}
          <TabsContent value="site">
            <Card>
              <CardHeader>
                <CardTitle>网站基本信息</CardTitle>
                <CardDescription>配置网站的基本信息和默认设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="siteName">网站名称</Label>
                    <Input
                      id="siteName"
                      value={siteSettings.siteName}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, siteName: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="siteDescription">网站描述</Label>
                    <Textarea
                      id="siteDescription"
                      value={siteSettings.siteDescription}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          siteDescription: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="siteUrl">网站地址</Label>
                    <Input
                      id="siteUrl"
                      type="url"
                      value={siteSettings.siteUrl}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, siteUrl: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactEmail">联系邮箱</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={siteSettings.contactEmail}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            contactEmail: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="contactPhone">联系电话</Label>
                      <Input
                        id="contactPhone"
                        value={siteSettings.contactPhone}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            contactPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="defaultLanguage">默认语言</Label>
                      <Select
                        value={siteSettings.defaultLanguage}
                        onValueChange={(value) =>
                          setSiteSettings({ ...siteSettings, defaultLanguage: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-CN">简体中文</SelectItem>
                          <SelectItem value="en-US">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="defaultCurrency">默认货币</Label>
                      <Select
                        value={siteSettings.defaultCurrency}
                        onValueChange={(value) =>
                          setSiteSettings({ ...siteSettings, defaultCurrency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNY">人民币 (¥)</SelectItem>
                          <SelectItem value="USD">美元 ($)</SelectItem>
                          <SelectItem value="EUR">欧元 (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSiteSettings} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        保存设置
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 支付设置 */}
          <TabsContent value="payment">
            <div className="space-y-6">
              {/* Stripe 设置 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Stripe 支付</CardTitle>
                      <CardDescription>配置 Stripe 支付网关</CardDescription>
                    </div>
                    <Switch
                      checked={paymentSettings.stripeEnabled}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({ ...paymentSettings, stripeEnabled: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stripePublicKey">Publishable Key</Label>
                    <Input
                      id="stripePublicKey"
                      type="password"
                      value={paymentSettings.stripePublicKey}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          stripePublicKey: e.target.value,
                        })
                      }
                      disabled={!paymentSettings.stripeEnabled}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stripeSecretKey">Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      value={paymentSettings.stripeSecretKey}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          stripeSecretKey: e.target.value,
                        })
                      }
                      disabled={!paymentSettings.stripeEnabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 支付宝设置 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>支付宝</CardTitle>
                      <CardDescription>配置支付宝支付</CardDescription>
                    </div>
                    <Switch
                      checked={paymentSettings.alipayEnabled}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({ ...paymentSettings, alipayEnabled: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    支付宝配置功能即将推出...
                  </p>
                </CardContent>
              </Card>

              {/* 微信支付设置 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>微信支付</CardTitle>
                      <CardDescription>配置微信支付</CardDescription>
                    </div>
                    <Switch
                      checked={paymentSettings.wechatPayEnabled}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          wechatPayEnabled: checked,
                        })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    微信支付配置功能即将推出...
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSavePaymentSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存设置
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 邮件设置 */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>SMTP 邮件服务器</CardTitle>
                <CardDescription>配置邮件发送服务器</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smtpHost">SMTP 主机</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                        }
                        placeholder="smtp.example.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="smtpPort">SMTP 端口</Label>
                      <Input
                        id="smtpPort"
                        value={emailSettings.smtpPort}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                        }
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smtpUser">SMTP 用户名</Label>
                      <Input
                        id="smtpUser"
                        value={emailSettings.smtpUser}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpUser: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="smtpPassword">SMTP 密码</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={emailSettings.smtpPassword}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            smtpPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emailFrom">发件人邮箱</Label>
                      <Input
                        id="emailFrom"
                        type="email"
                        value={emailSettings.emailFrom}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, emailFrom: e.target.value })
                        }
                        placeholder="noreply@example.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="emailFromName">发件人名称</Label>
                      <Input
                        id="emailFromName"
                        value={emailSettings.emailFromName}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, emailFromName: e.target.value })
                        }
                        placeholder="YoYo Mall"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">测试连接</Button>
                  <Button onClick={handleSaveEmailSettings} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        保存设置
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知设置 */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>通知偏好设置</CardTitle>
                <CardDescription>管理系统通知和提醒</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>订单通知</Label>
                      <p className="text-sm text-gray-500">
                        接收新订单和订单状态变更通知
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.orderNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          orderNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>用户通知</Label>
                      <p className="text-sm text-gray-500">
                        接收新用户注册和用户活动通知
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.userNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          userNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>库存警报</Label>
                      <p className="text-sm text-gray-500">
                        当商品库存低于阈值时接收警报
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.inventoryAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          inventoryAlerts: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>邮件通知</Label>
                      <p className="text-sm text-gray-500">
                        通过邮件接收通知
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>短信通知</Label>
                      <p className="text-sm text-gray-500">
                        通过短信接收重要通知
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          smsNotifications: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotificationSettings} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        保存设置
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="product-detail">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-blue-500" />
                    分享设置
                  </CardTitle>
                  <CardDescription>配置分享弹层的文案、渠道与链路</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <p className="font-medium text-gray-900">启用商品分享浮层</p>
                      <p className="text-sm text-gray-500">关闭后前台将隐藏分享按钮与分享弹窗</p>
                    </div>
                    <Switch
                      checked={productDetailConfig.share.enabled}
                      onCheckedChange={(checked) => updateShareConfig('enabled', checked)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="shareTitle">弹层标题</Label>
                      <Input
                        id="shareTitle"
                        value={productDetailConfig.share.title}
                        onChange={(e) => updateShareConfig('title', e.target.value)}
                        placeholder="例如：分享给好友"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shareSubtitle">副标题</Label>
                      <Input
                        id="shareSubtitle"
                        value={productDetailConfig.share.subtitle ?? ''}
                        onChange={(e) => updateShareConfig('subtitle', e.target.value)}
                        placeholder="例如：把这款好物推荐给你的朋友"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">分享渠道</h4>
                      <Button variant="outline" size="sm" onClick={handleAddShareChannel}>
                        <Plus className="mr-2 h-4 w-4" />
                        新增渠道
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      支持占位符：{'{url}'}、{'{title}'}、{'{description}'}、{'{image}'}，系统会自动替换为实际内容
                    </p>

                    <div className="space-y-3">
                      {productDetailConfig.share.channels.map((channel) => (
                        <div key={channel.id} className="space-y-4 rounded-lg border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {channel.label || '未命名渠道'}
                              </span>
                              <span className="text-xs uppercase tracking-wide text-gray-400">
                                {channel.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">启用</span>
                              <Switch
                                checked={channel.enabled}
                                onCheckedChange={(checked) =>
                                  handleShareChannelChange(channel.id, 'enabled', checked)
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveShareChannel(channel.id)}
                                disabled={productDetailConfig.share.channels.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                              <Label>显示名称</Label>
                              <Input
                                value={channel.label}
                                onChange={(e) =>
                                  handleShareChannelChange(channel.id, 'label', e.target.value)
                                }
                                placeholder="例如：Facebook"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>渠道类型</Label>
                              <Select
                                value={channel.type}
                                onValueChange={(value) =>
                                  handleShareChannelChange(
                                    channel.id,
                                    'type',
                                    value as ShareChannelType,
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SHARE_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label>图标关键字</Label>
                              <Input
                                value={channel.icon ?? ''}
                                onChange={(e) =>
                                  handleShareChannelChange(channel.id, 'icon', e.target.value)
                                }
                                placeholder="如 facebook / twitter / link"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>品牌色</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={channel.brandColor ?? '#3B82F6'}
                                  onChange={(e) =>
                                    handleShareChannelChange(channel.id, 'brandColor', e.target.value)
                                  }
                                  className="h-10 w-16 rounded-md border"
                                  aria-label="品牌色"
                                />
                                <Input
                                  value={channel.brandColor ?? ''}
                                  onChange={(e) =>
                                    handleShareChannelChange(channel.id, 'brandColor', e.target.value)
                                  }
                                  placeholder="#1877F2"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label>分享链接模板</Label>
                            <Input
                              value={channel.urlTemplate ?? ''}
                              onChange={(e) =>
                                handleShareChannelChange(channel.id, 'urlTemplate', e.target.value)
                              }
                              placeholder="https://www.facebook.com/sharer/sharer.php?u={url}"
                            />
                            <p className="text-xs text-gray-500">
                              建议保留 {'{url}'} 和 {'{title}'} 占位符，确保社交平台能正确识别链接
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    推荐模块
                  </CardTitle>
                  <CardDescription>控制相关推荐区域的展示、文案和数量</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <p className="font-medium text-gray-900">启用相关推荐</p>
                      <p className="text-sm text-gray-500">关闭后前台将不展示相关商品区域</p>
                    </div>
                    <Switch
                      checked={productDetailConfig.recommendations.enabled}
                      onCheckedChange={(checked) =>
                        updateRecommendationsConfig('enabled', checked)
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="recommendTitle">标题</Label>
                      <Input
                        id="recommendTitle"
                        value={productDetailConfig.recommendations.title}
                        onChange={(e) =>
                          updateRecommendationsConfig('title', e.target.value)
                        }
                        placeholder="例如：相关推荐"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recommendSubtitle">副标题</Label>
                      <Input
                        id="recommendSubtitle"
                        value={productDetailConfig.recommendations.subtitle ?? ''}
                        onChange={(e) =>
                          updateRecommendationsConfig('subtitle', e.target.value)
                        }
                        placeholder="例如：你可能也喜欢这些商品"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recommendLimit">展示数量</Label>
                      <Input
                        id="recommendLimit"
                        type="number"
                        min={1}
                        max={12}
                        value={productDetailConfig.recommendations.limit}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          const safeValue = Number.isNaN(next)
                            ? productDetailConfig.recommendations.limit
                            : Math.min(12, Math.max(1, next));
                          updateRecommendationsConfig('limit', safeValue);
                        }}
                      />
                      <p className="text-xs text-gray-500">建议 4-8 个之间，兼顾加载速度与内容丰富度</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    评价模块
                  </CardTitle>
                  <CardDescription>配置用户评价区域的可见性与展示文案</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div>
                        <p className="font-medium text-gray-900">启用评价模块</p>
                        <p className="text-sm text-gray-500">关闭后用户无法在商品详情页查看或提交评价</p>
                      </div>
                      <Switch
                        checked={productDetailConfig.reviews.enabled}
                        onCheckedChange={(checked) => updateReviewsConfig('enabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div>
                        <p className="font-medium text-gray-900">展示评分概览</p>
                        <p className="text-sm text-gray-500">显示平均分、评分分布等统计信息</p>
                      </div>
                      <Switch
                        checked={productDetailConfig.reviews.showSummary}
                        onCheckedChange={(checked) =>
                          updateReviewsConfig('showSummary', checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="reviewTitle">标题</Label>
                      <Input
                        id="reviewTitle"
                        value={productDetailConfig.reviews.title}
                        onChange={(e) => updateReviewsConfig('title', e.target.value)}
                        placeholder="例如：用户评价"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reviewSubtitle">副标题</Label>
                      <Input
                        id="reviewSubtitle"
                        value={productDetailConfig.reviews.subtitle ?? ''}
                        onChange={(e) => updateReviewsConfig('subtitle', e.target.value)}
                        placeholder="例如：来自真实购买者的反馈"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveProductDetailConfig} disabled={productConfigSaving}>
                  {productConfigSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存商品详情设置
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="announcements">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>公告管理</CardTitle>
                  <CardDescription>配置前台顶部公告条的展示内容与跳转行为</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="grid gap-2 md:w-72">
                      <Label htmlFor="announcement-rotation">轮播间隔 (毫秒)</Label>
                      <Input
                        id="announcement-rotation"
                        type="number"
                        min={1000}
                        value={announcementConfig.rotationInterval}
                        onChange={(e) =>
                          setAnnouncementConfig({
                            rotationInterval: Number.parseInt(e.target.value || '0', 10) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        多条公告同时启用时按照该间隔轮播，建议 3000-10000 之间。
                      </p>
                    </div>
                    <Button
                      onClick={handleSaveAnnouncementConfig}
                      disabled={announcementConfigSaving || announcementConfig.rotationInterval < 1000}
                    >
                      {announcementConfigSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          保存轮播设置
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-muted-foreground">
                      公告内容会在前台顶部居中展示，可配置背景色、文字色、图片及点击行为。
                    </p>
                    <Button onClick={openCreateAnnouncement}>
                      <Plus className="mr-2 h-4 w-4" />
                      新增公告
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {announcementLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((item) => (
                          <div key={item} className="skeleton-wave h-24 rounded-md" />
                        ))}
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
                        暂无公告，点击右上角「新增公告」开始配置。
                      </div>
                    ) : (
                      announcements
                        .slice()
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((item) => (
                          <Card key={item.id}>
                            <CardContent className="space-y-4 pt-4">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={item.isActive}
                                      onCheckedChange={() => handleToggleAnnouncement(item)}
                                    />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {item.title?.trim() || '未命名公告'}
                                      </p>
                                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>排序值</span>
                                        <Input
                                          type="number"
                                          defaultValue={item.sortOrder}
                                          className="h-7 w-24"
                                          onBlur={(event) =>
                                            handleSortOrderBlur(item, event.currentTarget.value)
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    动作：{ANNOUNCEMENT_ACTION_LABELS[item.actionType]}
                                    {item.actionType === 'URL' && item.linkUrl ? (
                                      <span className="ml-2 break-all text-primary">
                                        {item.linkUrl}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openEditAnnouncement(item)}>
                                    <Edit className="mr-1 h-4 w-4" />
                                    编辑
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleAnnouncementDelete(item.id)}
                                  >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    删除
                                  </Button>
                                </div>
                              </div>

                              <div
                                className="rounded-md px-4 py-3 text-sm"
                                style={{
                                  backgroundColor: item.backgroundColor || 'var(--primary)',
                                  color: item.textColor || '#ffffff',
                                  minHeight: item.height ?? 40,
                                }}
                              >
                                <div className="flex flex-col items-center justify-center gap-2 text-center">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title ?? '公告图片'}
                                      className="max-h-12 w-auto object-contain"
                                    />
                                  ) : null}
                                  {item.title ? (
                                    <span className="font-medium">{item.title}</span>
                                  ) : null}
                                  {item.content
                                    ?.split('\n')
                                    .filter(Boolean)
                                    .map((line, index) => (
                                      <span key={index} className="leading-tight">
                                        {line}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Dialog open={announcementDialogOpen} onOpenChange={closeAnnouncementDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingAnnouncementId ? '编辑公告' : '新增公告'}</DialogTitle>
                  <DialogDescription>配置公告显示内容与点击行为，所有字段均可选填。</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="announcement-title-input">标题（可选）</Label>
                    <Input
                      id="announcement-title-input"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, title: e.target.value })
                      }
                      placeholder="例如：限时免邮"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="announcement-content-input">展示文案</Label>
                    <Textarea
                      id="announcement-content-input"
                      rows={3}
                      value={announcementForm.content}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, content: e.target.value })
                      }
                      placeholder="支持多行输入，将按照换行符进行展示"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="announcement-image-input">Banner 图片地址（可选）</Label>
                    <Input
                      id="announcement-image-input"
                      value={announcementForm.imageUrl}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, imageUrl: e.target.value })
                      }
                      placeholder="https://example.com/banner.png"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-bg-input">背景色</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="announcement-bg-input"
                          value={announcementForm.backgroundColor}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              backgroundColor: e.target.value,
                            })
                          }
                          placeholder="#1D4ED8"
                        />
                        <Input
                          type="color"
                          className="h-10 w-16 cursor-pointer p-1"
                          value={announcementForm.backgroundColor || '#1D4ED8'}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              backgroundColor: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-text-input">文字颜色</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="announcement-text-input"
                          value={announcementForm.textColor}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              textColor: e.target.value,
                            })
                          }
                          placeholder="#FFFFFF"
                        />
                        <Input
                          type="color"
                          className="h-10 w-16 cursor-pointer p-1"
                          value={announcementForm.textColor || '#FFFFFF'}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              textColor: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-height-input">高度 (px)</Label>
                      <Input
                        id="announcement-height-input"
                        type="number"
                        min={24}
                        max={200}
                        value={announcementForm.height}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, height: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-sort-input">排序值</Label>
                      <Input
                        id="announcement-sort-input"
                        type="number"
                        value={announcementForm.sortOrder}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            sortOrder: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>是否启用</Label>
                      <div className="flex h-10 items-center gap-3 rounded-md border px-3">
                        <Switch
                          checked={announcementForm.isActive}
                          onCheckedChange={(checked) =>
                            setAnnouncementForm({ ...announcementForm, isActive: checked })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {announcementForm.isActive ? '已启用' : '未启用'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="announcement-action-select">点击动作</Label>
                      <Select
                        value={announcementForm.actionType}
                        onValueChange={(value: AnnouncementActionType) =>
                          setAnnouncementForm({ ...announcementForm, actionType: value })
                        }
                      >
                        <SelectTrigger id="announcement-action-select">
                          <SelectValue placeholder="选择操作" />
                        </SelectTrigger>
                        <SelectContent>
                          {announcementActionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {announcementForm.actionType === 'URL' && (
                      <div className="grid gap-2">
                        <Label htmlFor="announcement-link-input">跳转链接</Label>
                        <Input
                          id="announcement-link-input"
                          value={announcementForm.linkUrl}
                          onChange={(e) =>
                            setAnnouncementForm({ ...announcementForm, linkUrl: e.target.value })
                          }
                          placeholder="支持 /path 或完整链接"
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch
                            checked={announcementForm.openInNewTab}
                            onCheckedChange={(checked) =>
                              setAnnouncementForm({ ...announcementForm, openInNewTab: checked })
                            }
                          />
                          <span>新窗口打开</span>
                        </div>
                      </div>
                    )}
                    {announcementForm.actionType === 'OPEN_LOGIN_MODAL' && (
                      <p className="text-xs text-muted-foreground md:col-span-1">
                        用户点击后将弹出登录弹窗。
                      </p>
                    )}
                    {announcementForm.actionType === 'OPEN_REGISTER_MODAL' && (
                      <p className="text-xs text-muted-foreground md:col-span-1">
                        用户点击后将弹出注册弹窗。
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => closeAnnouncementDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAnnouncementSubmit} disabled={announcementSaving}>
                    {announcementSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        保存公告
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
