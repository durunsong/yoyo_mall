/**
 * 登录注册弹窗组件 - shadcn/ui版本
 * 使用 next-auth (credentials + Google) 与真实注册接口
 */

'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { signIn } from 'next-auth/react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useStaticTranslations } from '@/hooks/use-i18n';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

// 登录表单验证
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  remember: z.boolean().optional(),
});

// 注册表单验证
const registerSchema = z.object({
  username: z.string().min(2, '用户名至少2位').max(20, '用户名最多20位'),
  email: z.string().email('请输入有效的邮箱地址'),
  phone: z.string().optional(),
  password: z.string().min(6, '密码至少6位').max(20, '密码最多20位'),
  confirmPassword: z.string(),
  agreement: z.boolean().refine(val => val === true, '请同意用户协议'),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export function AuthModalShadcn({ open, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { t } = useStaticTranslations('auth');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 登录表单
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  // 注册表单
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', phone: '', password: '', confirmPassword: '', agreement: false },
  });

  // 密码强度计算
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 6,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
    };
    Object.values(checks).forEach(check => { if (check) score += 20; });
    return { score, checks } as const;
  };

  const password = registerForm.watch('password');
  const { score: passwordScore, checks: passwordChecks } = calculatePasswordStrength(password || '');

  // 登录处理（next-auth credentials）
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('开始登录:', data.email);
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/',
      });
      
      console.log('登录结果:', res);
      
      if (res?.ok && !res.error) {
        toast.success(t('loginSuccess'), { description: t('welcomeBack') });
        onClose();
        // 强制刷新页面以更新session状态
        window.location.reload();
      } else {
        toast.error(t('loginFailed'), { description: res?.error || t('invalidCredentials') });
      }
    } catch (error) {
      console.error('登录错误:', error);
      toast.error(t('loginFailed'), { description: t('invalidCredentials') });
    } finally {
      setIsLoading(false);
    }
  };

  // 注册处理（真实接口）
  const handleRegister = async (data: RegisterFormData) => {
    console.log('注册表单提交:', data);
    setIsLoading(true);
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.username, email: data.email, password: data.password }),
      });
      const json = await resp.json();
      console.log('注册响应:', json);
      if (resp.ok && json?.success) {
        toast.success(t('registerSuccess') || '注册成功', { description: t('accountCreated') || '账户创建成功' });
        // 注册成功后自动登录
        const signInRes = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        if (signInRes?.ok) {
          onClose();
        } else {
          setActiveTab('login');
        }
      } else {
        toast.error(t('registerFailed') || '注册失败', { description: json?.message || t('registrationError') || '注册过程中出现错误' });
      }
    } catch (error) {
      console.error('注册错误:', error);
      toast.error(t('registerFailed') || '注册失败', { description: t('registrationError') || '网络错误，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  // Google 登录（next-auth）
  const handleGoogleLogin = useCallback(() => {
    signIn('google', { callbackUrl: '/' });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activeTab === 'login' ? t('login') : t('register')}</DialogTitle>
          <DialogDescription>
            {activeTab === 'login' ? t('loginDescription') : t('registerDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('login')}</TabsTrigger>
            <TabsTrigger value="register">{t('register')}</TabsTrigger>
          </TabsList>

          {/* 登录表单 */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="login-email" type="email" placeholder={t('email')} className="pl-10" {...loginForm.register('email')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder={t('password')} className="pl-10 pr-10" {...loginForm.register('password')} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" {...loginForm.register('remember')} />
                  <Label htmlFor="remember" className="text-sm">{t('rememberMe')}</Label>
                </div>
                <Button variant="link" className="px-0 text-sm">{t('forgotPassword')}</Button>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('loading') : t('login')}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('or')}</span>
              </div>
            </div>

            {/* Google 一键登录 */}
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              {/* 简单的Google样式 */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-5 w-5"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.156,7.961,3.039l5.657-5.657C32.843,6.053,28.623,4,24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.817C14.655,16.214,19.005,13,24,13c3.059,0,5.842,1.156,7.961,3.039l5.657-5.657C32.843,6.053,28.623,4,24,4C16.318,4,9.656,8.254,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c4.549,0,8.725-1.744,11.862-4.583l-5.479-5.14C28.345,35.83,26.274,36.5,24,36.5c-5.202,0-9.619-3.323-11.281-7.954l-6.49,5.004C9.632,39.668,16.235,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.221-4.074,5.617l5.479,5.14C39.321,35.546,44,30.059,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
              {t('loginWithGoogle')}
            </Button>
          </TabsContent>

          {/* 注册表单 */}
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username">{t('firstName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="register-username" placeholder={t('firstName')} className="pl-10" {...registerForm.register('username')} />
                </div>
                {registerForm.formState.errors.username && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="register-email" type="email" placeholder={t('email')} className="pl-10" {...registerForm.register('email')} />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone">{t('phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="register-phone" placeholder={t('phone')} className="pl-10" {...registerForm.register('phone')} />
                </div>
                {registerForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="register-password" type={showPassword ? 'text' : 'password'} placeholder={t('password')} className="pl-10 pr-10" {...registerForm.register('password')} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* 密码强度指示器 */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('passwordStrength') || '密码强度'}</span>
                    <span className="text-sm">{passwordScore < 40 ? '弱' : passwordScore < 80 ? '中' : '强'}</span>
                  </div>
                  <Progress value={passwordScore} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">{passwordChecks.length ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}<span>至少6位</span></div>
                    <div className="flex items-center space-x-1">{passwordChecks.numbers ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}<span>包含数字</span></div>
                    <div className="flex items-center space-x-1">{passwordChecks.lowercase ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}<span>包含小写</span></div>
                    <div className="flex items-center space-x-1">{passwordChecks.uppercase ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}<span>包含大写</span></div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="register-confirm-password" type={showConfirmPassword ? 'text' : 'password'} placeholder={t('confirmPassword')} className="pl-10 pr-10" {...registerForm.register('confirmPassword')} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="agreement" 
                  checked={registerForm.watch('agreement')}
                  onCheckedChange={(checked) => registerForm.setValue('agreement', checked)}
                />
                <Label htmlFor="agreement" className="text-sm">{t('termsAndConditions')}</Label>
              </div>
              {registerForm.formState.errors.agreement && (
                <p className="text-sm text-destructive">{registerForm.formState.errors.agreement.message}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('loading') : t('register')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
