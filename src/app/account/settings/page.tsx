/**
 * 账户设置页面
 * 用户可以编辑个人资料、修改密码、设置偏好等
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, User, Lock, Bell, Globe, Upload, Camera } from 'lucide-react';

export default function AccountSettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
          console.error('获取用户资料失败:', error);
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
      toast.error('请上传图片文件');
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过 10MB');
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
        
        // 短暂延迟后刷新页面,确保 session 已更新
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
        toast.success('头像上传成功,页面即将刷新');
      } else {
        toast.error(data.error || '头像上传失败');
      }
    } catch (error) {
      console.error('头像上传错误:', error);
      toast.error('头像上传失败');
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
        toast.success('个人资料更新成功');
        
        // 短暂延迟后刷新页面,确保昵称在导航栏更新
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('更新个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('密码长度至少为6位');
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
        toast.success('密码修改成功');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(data.error || '修改失败');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">账户设置</h1>
          <p className="text-gray-600 mt-2">管理您的个人信息和偏好设置</p>
        </div>

        {/* 设置选项卡 */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">个人资料</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">安全设置</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">通知设置</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">偏好设置</span>
            </TabsTrigger>
          </TabsList>

          {/* 个人资料 */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>个人资料</CardTitle>
                <CardDescription>更新您的个人信息</CardDescription>
              </CardHeader>
              <CardContent>
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
                                  上传中...
                                </>
                              ) : (
                                <>
                                  <Camera className="mr-2 h-4 w-4" />
                                  更换头像
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
                        支持 JPG、PNG、GIF 格式，最大 10MB
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
                        <p className="text-sm text-gray-600">账户角色</p>
                        <p className="font-medium text-blue-600">
                          {(session?.user as any)?.role === 'ADMIN' && '管理员'}
                          {(session?.user as any)?.role === 'SUPER_ADMIN' && '超级管理员'}
                          {(session?.user as any)?.role === 'CUSTOMER' && '普通用户'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 基本信息 */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">昵称 *</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        placeholder="请输入昵称"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">邮箱不可修改</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">手机号</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        placeholder="请输入手机号"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">性别</Label>
                      <Select
                        value={profileForm.gender}
                        onValueChange={(value) =>
                          setProfileForm({ ...profileForm, gender: value })
                        }
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="选择性别" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">男</SelectItem>
                          <SelectItem value="FEMALE">女</SelectItem>
                          <SelectItem value="OTHER">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">国家/地区</Label>
                      <Input
                        id="country"
                        value={profileForm.country}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, country: e.target.value })
                        }
                        placeholder="例如: 中国"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">生日</Label>
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
                    <Label htmlFor="bio">个人简介</Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      placeholder="介绍一下自己..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">
                      {profileForm.bio.length}/500 字符
                    </p>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/account')}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      保存更改
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全设置 */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>安全设置</CardTitle>
                <CardDescription>修改密码和安全选项</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">当前密码</Label>
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
                      placeholder="请输入当前密码"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新密码</Label>
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
                      placeholder="请输入新密码(至少6位)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
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
                      placeholder="请再次输入新密码"
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
                      重置
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      修改密码
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知设置 */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>管理您接收的通知类型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">订单通知</p>
                      <p className="text-sm text-gray-500">接收订单状态更新通知</p>
                    </div>
                    <Button variant="outline" size="sm">
                      开启
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">促销通知</p>
                      <p className="text-sm text-gray-500">接收优惠活动和促销信息</p>
                    </div>
                    <Button variant="outline" size="sm">
                      开启
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">邮件通知</p>
                      <p className="text-sm text-gray-500">通过邮件接收重要通知</p>
                    </div>
                    <Button variant="outline" size="sm">
                      开启
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 偏好设置 */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>偏好设置</CardTitle>
                <CardDescription>自定义您的使用体验</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">语言</p>
                      <p className="text-sm text-gray-500">选择界面显示语言</p>
                    </div>
                    <Button variant="outline" size="sm">
                      中文
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">货币</p>
                      <p className="text-sm text-gray-500">选择价格显示货币</p>
                    </div>
                    <Button variant="outline" size="sm">
                      CNY ¥
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">主题</p>
                      <p className="text-sm text-gray-500">选择界面主题</p>
                    </div>
                    <Button variant="outline" size="sm">
                      浅色
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

