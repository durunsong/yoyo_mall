/**
 * 账户设置页面
 * 用户可以编辑个人资料、修改密码、设置偏好等
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, User, Lock, Bell, Globe, Camera } from 'lucide-react';
import { useStaticTranslations } from '@/hooks/use-i18n';

export default function AccountSettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { t } = useStaticTranslations('account');
  const { t: tCommon } = useStaticTranslations('common');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 个人资料表单
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    country: '',
    dateOfBirth: '',
    bio: '',
    avatar: '',
  });

  // 密码表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 获取用户资料
  useEffect(() => {
    const fetchProfile = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setProfileLoading(true);
          const response = await fetch('/api/user/profile');
          const data = await response.json();
          
          if (data && !data.error) {
            setProfileForm({
              name: data.name || '',
              email: data.email || '',
              phone: data.profile?.phone || '',
              gender: data.profile?.gender || '',
              country: data.profile?.location || '',
              dateOfBirth: data.profile?.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0] : '',
              bio: data.profile?.bio || '',
              avatar: data.avatar || '',
            });
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();
  }, [status, session]);

  // 如果未登录,跳转到登录页
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // 头像上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error(t('settings.toasts.invalidFile'));
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('settings.toasts.fileTooLarge'));
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // 立即更新表单显示
        setProfileForm({ ...profileForm, avatar: data.avatarUrl });
        
        // 强制更新 session - 关键! 使用 user 字段确保 next-auth v5 正确合并
        await updateSession({
          user: {
            avatar: data.avatarUrl,
            image: data.avatarUrl, // 同时更新 image 字段
          },
        });
        
        // 不再强刷页面，依赖 updateSession 触发全局重渲染
        toast.success(t('settings.toasts.avatarUploadSuccess'));
      } else {
        toast.error(data.error || t('settings.toasts.avatarUploadFailed'));
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(t('settings.toasts.avatarUploadFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 更新个人资料
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          gender: profileForm.gender,
          location: profileForm.country,
          dateOfBirth: profileForm.dateOfBirth,
          bio: profileForm.bio,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新 session，使用 user 字段
        await updateSession({ user: { name: profileForm.name } });
        toast.success(t('settings.toasts.profileUpdateSuccess'));
        
        // 不再强刷页面，由 next-auth 的 update 触发 Header 与页面重渲染
      } else {
        toast.error(data.error || t('settings.toasts.profileUpdateFailed'));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(t('settings.toasts.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.toasts.passwordMismatch'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t('settings.toasts.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('settings.toasts.passwordUpdateSuccess'));
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(data.error || t('settings.toasts.passwordUpdateFailed'));
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(t('settings.toasts.passwordUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const showSkeleton = status === 'loading' || profileLoading;

  const SkeletonBlock = useMemo(
    () => (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full skeleton-wave" />
          <div className="flex-1 space-y-3">
            <div className="h-10 w-36 rounded-full skeleton-wave" />
            <div className="h-3 w-56 rounded skeleton-wave" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 rounded skeleton-wave" />
              <div className="h-10 w-full rounded skeleton-wave" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-4 w-24 rounded skeleton-wave" />
          <div className="h-24 w-full rounded skeleton-wave" />
        </div>
      </div>
    ),
    [],
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('settings.pageTitle')}</h1>
          <p className="text-gray-600 mt-2">{t('settings.pageSubtitle')}</p>
        </div>

        {/* 设置选项卡 */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.password')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.preferences')}</span>
            </TabsTrigger>
          </TabsList>

          {/* 个人资料 */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profile.title')}</CardTitle>
                <CardDescription>{t('settings.profile.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {showSkeleton ? (
                  SkeletonBlock
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* 头像上传 */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileForm.avatar} alt={profileForm.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-2xl text-white">
                        {profileForm.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingAvatar}
                            asChild
                          >
                            <span>
                              {uploadingAvatar ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t('settings.profile.uploading')}
                                </>
                              ) : (
                                <>
                                  <Camera className="mr-2 h-4 w-4" />
                                  {t('settings.profile.avatarUpload')}
                                </>
                              )}
                            </span>
                          </Button>
                        </div>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        {t('settings.profile.avatarHint')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* 账户信息展示 */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('settings.profile.accountRole')}</p>
                        <p className="font-medium text-blue-600">
                          {(session?.user as any)?.role === 'ADMIN' && t('settings.profile.roles.admin')}
                          {(session?.user as any)?.role === 'SUPER_ADMIN' && t('settings.profile.roles.superAdmin')}
                          {(session?.user as any)?.role === 'CUSTOMER' && t('settings.profile.roles.customer')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 基本信息 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">{`${t('settings.profile.fields.name')} *`}</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        placeholder={t('settings.profile.placeholders.name')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('settings.profile.fields.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">{t('settings.profile.emailHint')}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('settings.profile.fields.phone')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        placeholder={t('settings.profile.placeholders.phone')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">{t('settings.profile.fields.gender')}</Label>
                      <Select
                        value={profileForm.gender}
                        onValueChange={(value) =>
                          setProfileForm({ ...profileForm, gender: value })
                        }
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder={t('settings.profile.genderPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">{t('settings.profile.genderOptions.male')}</SelectItem>
                          <SelectItem value="FEMALE">{t('settings.profile.genderOptions.female')}</SelectItem>
                          <SelectItem value="OTHER">{t('settings.profile.genderOptions.other')}</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">
                            {t('settings.profile.genderOptions.preferNotToSay')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">{t('settings.profile.fields.country')}</Label>
                      <Input
                        id="country"
                        value={profileForm.country}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, country: e.target.value })
                        }
                        placeholder={t('settings.profile.placeholders.country')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">{t('settings.profile.fields.dateOfBirth')}</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* 个人简介 */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t('settings.profile.fields.bio')}</Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      placeholder={t('settings.profile.placeholders.bio')}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">
                      {t('settings.profile.bioCount', { used: profileForm.bio.length })}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/account')}
                    >
                      {tCommon('cancel')}
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {tCommon('saveChanges')}
                    </Button>
                  </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全设置 */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.password.title')}</CardTitle>
                <CardDescription>{t('settings.password.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {showSkeleton ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <div className="h-4 w-28 rounded skeleton-wave" />
                        <div className="h-10 w-full rounded skeleton-wave" />
                      </div>
                    ))}
                    <div className="mt-6 flex justify-end gap-3">
                      <div className="h-10 w-24 rounded-full skeleton-wave" />
                      <div className="h-10 w-32 rounded-full skeleton-wave" />
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('settings.password.fields.current')}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder={t('settings.password.placeholders.current')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('settings.password.fields.new')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder={t('settings.password.placeholders.new')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('settings.password.fields.confirm')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder={t('settings.password.placeholders.confirm')}
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }
                    >
                      {tCommon('reset')}
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('settings.password.submit')}
                    </Button>
                  </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知设置 */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
                <CardDescription>{t('settings.notifications.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {showSkeleton ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded skeleton-wave" />
                          <div className="h-3 w-52 rounded skeleton-wave" />
                        </div>
                        <div className="h-9 w-24 rounded-full skeleton-wave" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.notifications.orderUpdates')}</p>
                      <p className="text-sm text-gray-500">{t('settings.notifications.orderUpdatesDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {t('settings.notifications.enable')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.notifications.promotions')}</p>
                      <p className="text-sm text-gray-500">{t('settings.notifications.promotionsDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {t('settings.notifications.enable')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t('settings.notifications.newsletter')}</p>
                      <p className="text-sm text-gray-500">{t('settings.notifications.newsletterDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {t('settings.notifications.enable')}
                    </Button>
                  </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 偏好设置 */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.preferences.title')}</CardTitle>
                <CardDescription>{t('settings.preferences.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {showSkeleton ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded skeleton-wave" />
                          <div className="h-3 w-48 rounded skeleton-wave" />
                        </div>
                        <div className="h-9 w-24 rounded-full skeleton-wave" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{t('settings.preferences.language')}</p>
                        <p className="text-sm text-gray-500">{t('settings.preferences.languageDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                        {t('settings.preferences.languageValue')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{t('settings.preferences.currency')}</p>
                        <p className="text-sm text-gray-500">{t('settings.preferences.currencyDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                        {t('settings.preferences.currencyValue')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{t('settings.preferences.theme')}</p>
                        <p className="text-sm text-gray-500">{t('settings.preferences.themeDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                        {t('settings.preferences.themeValue')}
                    </Button>
                  </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}




