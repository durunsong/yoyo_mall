/**
 * 系统设置页面
 * 提供网站配置、支付设置、邮件设置等功能
 */

'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

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
    stripeEnabled: true,
    stripePublicKey: '',
    stripeSecretKey: '',
    alipayEnabled: false,
    wechatPayEnabled: false,
  });

  // 邮件设置
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
  });

  // 通知设置
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    userNotifications: true,
    inventoryAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  // 保存网站设置
  const handleSaveSiteSettings = async () => {
    try {
      setSaving(true);
      // TODO: 调用 API 保存设置
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('网站设置已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存支付设置
  const handleSavePaymentSettings = async () => {
    try {
      setSaving(true);
      // TODO: 调用 API 保存设置
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('支付设置已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存邮件设置
  const handleSaveEmailSettings = async () => {
    try {
      setSaving(true);
      // TODO: 调用 API 保存设置
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('邮件设置已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存通知设置
  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true);
      // TODO: 调用 API 保存设置
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('通知设置已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
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
          <TabsList className="grid w-full grid-cols-4">
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
                      <Label htmlFor="fromEmail">发件人邮箱</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                        }
                        placeholder="noreply@example.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="fromName">发件人名称</Label>
                      <Input
                        id="fromName"
                        value={emailSettings.fromName}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, fromName: e.target.value })
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
