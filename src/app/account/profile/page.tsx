/**
 * 个人资料管理页面
 * 实现用户信息编辑和头像上传功能
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Save,
  Upload,
  Loader2,
  Camera,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// 用户资料接口
interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  locale?: string;
  timezone?: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // 加载用户资料
  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setProfileData(data.data.profile || {});
        setAvatarPreview(data.data.avatar || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('加载资料失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新基本资料
  const handleUpdateProfile = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('资料更新成功');
        // 更新session
        await update();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 上传头像
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAvatarPreview(data.url);
        toast.success('头像上传成功');
        // 更新session
        await update();
      } else {
        toast.error(data.error || '上传失败');
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    // 验证密码
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('密码修改成功');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(data.error || '修改失败');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('修改失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="skeleton-wave mb-2 h-9 w-32 rounded" />
          <div className="skeleton-wave h-5 w-64 rounded" />
        </div>

        {/* 标签页骨架 */}
        <div className="space-y-6">
          <div className="skeleton-wave h-10 w-64 rounded" />

          {/* 头像卡片骨架 */}
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-6 w-16 rounded" />
              <div className="skeleton-wave h-4 w-40 rounded" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="skeleton-wave h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-wave h-10 w-32 rounded" />
                  <div className="skeleton-wave h-4 w-48 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 基本信息表单骨架 */}
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-6 w-24 rounded" />
              <div className="skeleton-wave h-4 w-48 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="skeleton-wave h-4 w-20 rounded" />
                  <div className="skeleton-wave h-10 w-full rounded" />
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <div className="skeleton-wave h-10 w-32 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
        <p className="mt-1 text-gray-600">管理您的个人信息和账户设置</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">基本资料</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        {/* 基本资料标签页 */}
        <TabsContent value="profile" className="space-y-6">
          {/* 头像上传 */}
          <Card>
            <CardHeader>
              <CardTitle>头像</CardTitle>
              <CardDescription>上传您的个人头像</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || session?.user?.image || ''} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Camera className="h-4 w-4" />
                    {uploading ? '上传中...' : '更换头像'}
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    支持 JPG、PNG 格式，大小不超过 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>更新您的个人基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">名</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName || ''}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                    placeholder="请输入名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">姓</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName || ''}
                    onChange={(e) =>
                      setProfileData({ ...profileData, lastName: e.target.value })
                    }
                    placeholder="请输入姓"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-gray-500">邮箱地址不可修改</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone || ''}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="请输入手机号"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">出生日期</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth || ''}
                      onChange={(e) =>
                        setProfileData({ ...profileData, dateOfBirth: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">性别</Label>
                  <Select
                    value={profileData.gender || ''}
                    onValueChange={(value: 'MALE' | 'FEMALE' | 'OTHER') =>
                      setProfileData({ ...profileData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">男</SelectItem>
                      <SelectItem value="FEMALE">女</SelectItem>
                      <SelectItem value="OTHER">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleUpdateProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存更改
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置标签页 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>更新您的登录密码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">当前密码</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="请输入当前密码"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="请输入新密码(至少6位)"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="请再次输入新密码"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleChangePassword} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      修改中...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      修改密码
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

