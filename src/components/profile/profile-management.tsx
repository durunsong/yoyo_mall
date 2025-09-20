'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Phone, 
  Calendar,
  Save,
  History,
  Shield,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useStaticTranslations } from '@/hooks/use-i18n';
import { AvatarUpload } from '@/components/profile/avatar-upload';

// 个人信息表单验证
const profileSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bio: z.string().max(500, '个人简介不能超过500个字符').optional(),
  location: z.string().max(100, '位置信息不能超过100个字符').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface LoginRecord {
  id: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export function ProfileManagement() {
  const { data: session, update } = useSession();
  const { t: tCommon } = useStaticTranslations('common');
  const { t: tAccount } = useStaticTranslations('account');
  const [isLoading, setIsLoading] = useState(false);
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  // const [profileData, setProfileData] = useState<unknown>(null);

  // 表单配置
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      bio: '',
      location: '',
    },
  });

  // 获取用户详细信息
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile();
      fetchLoginRecords();
    }
  }, [session?.user?.id]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        
        // 更新表单默认值
        const dob = data.profile?.dateOfBirth
          ? (typeof data.profile.dateOfBirth === 'string'
              ? data.profile.dateOfBirth.split('T')[0]
              : new Date(data.profile.dateOfBirth).toISOString().split('T')[0])
          : '';

        form.reset({
          name: data.name || '',
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          phone: data.profile?.phone || '',
          dateOfBirth: dob,
          bio: data.profile?.bio || '',
          location: data.profile?.location || '',
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const fetchLoginRecords = async () => {
    try {
      const response = await fetch('/api/user/login-records');
      if (response.ok) {
        const data = await response.json();
        setLoginRecords(data);
      }
    } catch (error) {
      console.error('获取登录记录失败:', error);
    }
  };

  // 更新个人信息
  const handleUpdateProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await response.json();

        // 更新 session（仅提交变更字段）
        await update({ user: { name: data.name } });

        toast.success(tAccount('toasts.profileUpdated'));
        fetchUserProfile(); // 重新获取最新数据
      } else {
        const error = await response.json();
        toast.error(error.message || tAccount('toasts.updateFailed'));
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      toast.error(tAccount('toasts.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 头像更新成功回调
  const handleAvatarUpdate = async (avatarUrl: string) => {
    await update({ user: { image: avatarUrl } });
    toast.success(tAccount('toasts.avatarUpdated'));
    fetchUserProfile();
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{tAccount('pageTitle')}</h1>
        <Badge variant="secondary">{session.user.role || 'CUSTOMER'}</Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">{tAccount('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="security">{tAccount('tabs.security')}</TabsTrigger>
          <TabsTrigger value="activity">{tAccount('tabs.activity')}</TabsTrigger>
        </TabsList>

        {/* 个人信息标签页 */}
        <TabsContent
          value="profile"
          className="space-y-6 transition-all duration-300 ease-out data-[state=inactive]:opacity-0 data-[state=inactive]:-translate-x-4 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 motion-reduce:transition-none"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {tAccount('sections.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像部分 */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={session.user.image || '/avatars/default-avatar.svg'} 
                      alt={session.user.name || 'User Avatar'} 
                    />
                    <AvatarFallback className="text-2xl">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{session.user.name || session.user.email}</h3>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <AvatarUpload onUploadSuccess={handleAvatarUpdate} />
                </div>
              </div>

              <Separator />

              {/* 个人信息表单 */}
              <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{tAccount('labels.displayName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder={tAccount('placeholders.displayName')}
                        className="pl-10"
                        {...form.register('name')}
                      />
                    </div>
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{tAccount('labels.phone')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder={tAccount('placeholders.phone')}
                        className="pl-10"
                        {...form.register('phone')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName">{tAccount('labels.firstName')}</Label>
                    <Input
                      id="firstName"
                      placeholder={tAccount('placeholders.firstName')}
                      {...form.register('firstName')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{tAccount('labels.lastName')}</Label>
                    <Input
                      id="lastName"
                      placeholder={tAccount('placeholders.lastName')}
                      {...form.register('lastName')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{tAccount('labels.dateOfBirth')}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="pl-10"
                        {...form.register('dateOfBirth')}
                      />
                    </div>
                  </div>

                  {/* 暂时隐藏，等待数据库迁移 */}
                  {/* <div className="space-y-2">
                    <Label htmlFor="location">所在地</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="请输入所在地"
                        className="pl-10"
                        {...form.register('location')}
                      />
                    </div>
                  </div> */}
                </div>

                {/* 暂时隐藏，等待数据库迁移 */}
                {/* <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    placeholder="介绍一下自己..."
                    rows={4}
                    {...form.register('bio')}
                  />
                  {form.formState.errors.bio && (
                    <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
                  )}
                </div> */}

                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? tAccount('buttons.saving') : tAccount('buttons.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置标签页 */}
        <TabsContent
          value="security"
          className="space-y-6 transition-all duration-300 ease-out data-[state=inactive]:opacity-0 data-[state=inactive]:-translate-x-4 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 motion-reduce:transition-none"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {tAccount('sections.accountSecurity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{tAccount('labels.email')}</h4>
                    <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  </div>
                  <Badge variant="outline">{tAccount('status.verified')}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{tAccount('labels.password')}</h4>
                    <p className="text-sm text-muted-foreground">{tCommon('passwordTip') || ''}</p>
                  </div>
                  <Button variant="outline">{tAccount('buttons.changePassword')}</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{tAccount('labels.twoFactor')}</h4>
                    <p className="text-sm text-muted-foreground">{tCommon('twoFactorTip') || ''}</p>
                  </div>
                  <Button variant="outline">{tAccount('buttons.enable')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 活动记录标签页 */}
        <TabsContent
          value="activity"
          className="space-y-6 transition-all duration-300 ease-out data-[state=inactive]:opacity-0 data-[state=inactive]:-translate-x-4 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 motion-reduce:transition-none"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {tAccount('sections.loginRecords')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loginRecords.length > 0 ? (
                  loginRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {new Date(record.loginTime).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tAccount('labels.ip')}: {record.ipAddress}
                        </p>
                        {record.location && (
                          <p className="text-sm text-muted-foreground">
                            {tAccount('labels.location')}: {record.location}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {record.userAgent.includes('Mobile') ? tAccount('status.mobile') : tAccount('status.desktop')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {tAccount('status.noRecords')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
