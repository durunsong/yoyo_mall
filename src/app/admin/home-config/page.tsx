'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { HomeConfigSkeleton } from '@/components/admin/admin-skeleton';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, GripVertical, Trash2, Save, Eye, Settings, Package, Grid3x3, Image, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  HomePageModule,
  ProductSectionConfig,
  PromoBannerConfig,
  CategoryNavConfig,
  BannerConfig,
} from '@/types/home-config';

// 可拖拽的模块项组件
function SortableModuleItem({
  module,
  onEdit,
  onDelete,
  onToggle,
}: {
  module: HomePageModule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 获取模块类型的中文名称和图标
  const getModuleInfo = (type: string) => {
    const infoMap: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
      banner: { name: '轮播图', icon: <Image className="h-4 w-4" />, color: 'text-blue-500' },
      'category-nav': { name: '分类导航', icon: <Grid3x3 className="h-4 w-4" />, color: 'text-purple-500' },
      'product-section': { name: '商品模块', icon: <Package className="h-4 w-4" />, color: 'text-green-500' },
      'promo-banner': { name: '促销横幅', icon: <Tag className="h-4 w-4" />, color: 'text-orange-500' },
      'brand-showcase': { name: '品牌展示', icon: <Grid3x3 className="h-4 w-4" />, color: 'text-pink-500' },
      'content-cards': { name: '内容卡片', icon: <Grid3x3 className="h-4 w-4" />, color: 'text-indigo-500' },
    };
    return infoMap[type] || { name: type, icon: <Grid3x3 className="h-4 w-4" />, color: 'text-gray-500' };
  };

  const moduleInfo = getModuleInfo(module.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md ${
        !module.enabled ? 'opacity-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className={`${moduleInfo.color}`}>{moduleInfo.icon}</div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{moduleInfo.name}</span>
          {module.type === 'product-section' && (
            <span className="text-sm text-gray-500">
              · {(module.config as ProductSectionConfig).title}
            </span>
          )}
          {module.type === 'promo-banner' && (
            <span className="text-sm text-gray-500">
              · {(module.config as PromoBannerConfig).title}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {module.type === 'product-section' &&
            `${(module.config as ProductSectionConfig).limit} 个商品 · ${(module.config as ProductSectionConfig).layout} 布局`}
          {module.type === 'promo-banner' && `${(module.config as PromoBannerConfig).type} 类型`}
        </div>
      </div>

      <Switch checked={module.enabled} onCheckedChange={onToggle} />

      <Button variant="outline" size="sm" onClick={onEdit}>
        <Settings className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onDelete} className="hover:bg-red-50">
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

// 模块编辑对话框
function ModuleEditDialog({
  open,
  module,
  onClose,
  onSave,
}: {
  open: boolean;
  module: HomePageModule | null;
  onClose: () => void;
  onSave: (config: any) => void;
}) {
  const [config, setConfig] = useState<any>(module?.config || {});

  useEffect(() => {
    if (module) {
      setConfig(module.config);
    }
  }, [module]);

  if (!module) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  // 渲染不同类型模块的编辑表单
  const renderConfigForm = () => {
    switch (module.type) {
      case 'product-section':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">模块标题</Label>
              <Input
                id="title"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="如：热卖商品、新品推荐"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">副标题（选填）</Label>
              <Input
                id="subtitle"
                value={config.subtitle || ''}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                placeholder="补充说明文字"
              />
            </div>
            <div>
              <Label htmlFor="type">商品类型</Label>
              <Select value={config.type || 'featured'} onValueChange={(v) => setConfig({ ...config, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">精选商品</SelectItem>
                  <SelectItem value="new">新品</SelectItem>
                  <SelectItem value="bestseller">畅销商品</SelectItem>
                  <SelectItem value="deals">特惠商品</SelectItem>
                  <SelectItem value="category">按分类</SelectItem>
                  <SelectItem value="manual">手动选择</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.type === 'category' && (
              <div>
                <Label htmlFor="categoryId">选择分类</Label>
                <Input
                  id="categoryId"
                  value={config.categoryId || ''}
                  onChange={(e) => setConfig({ ...config, categoryId: e.target.value })}
                  placeholder="分类ID"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="limit">显示数量</Label>
                <Input
                  id="limit"
                  type="number"
                  value={config.limit || 10}
                  onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) })}
                  min={1}
                  max={50}
                />
              </div>
              <div>
                <Label htmlFor="columns">列数</Label>
                <Select
                  value={String(config.columns || 5)}
                  onValueChange={(v) => setConfig({ ...config, columns: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3列</SelectItem>
                    <SelectItem value="4">4列</SelectItem>
                    <SelectItem value="5">5列</SelectItem>
                    <SelectItem value="6">6列</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="layout">布局样式</Label>
              <Select value={config.layout || 'grid'} onValueChange={(v) => setConfig({ ...config, layout: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">网格布局</SelectItem>
                  <SelectItem value="carousel">轮播布局</SelectItem>
                  <SelectItem value="list">列表布局</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-base font-medium">显示选项</Label>
              <div className="flex items-center justify-between">
                <Label htmlFor="showPrice" className="font-normal">
                  显示价格
                </Label>
                <Switch
                  id="showPrice"
                  checked={config.showPrice !== false}
                  onCheckedChange={(checked) => setConfig({ ...config, showPrice: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showRating" className="font-normal">
                  显示评分
                </Label>
                <Switch
                  id="showRating"
                  checked={config.showRating !== false}
                  onCheckedChange={(checked) => setConfig({ ...config, showRating: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showDiscount" className="font-normal">
                  显示折扣标签
                </Label>
                <Switch
                  id="showDiscount"
                  checked={config.showDiscount !== false}
                  onCheckedChange={(checked) => setConfig({ ...config, showDiscount: checked })}
                />
              </div>
            </div>
          </div>
        );

      case 'promo-banner':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">横幅标题</Label>
              <Input
                id="title"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="促销活动标题"
              />
            </div>
            <div>
              <Label htmlFor="description">描述文字</Label>
              <Textarea
                id="description"
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="活动描述"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">图片地址</Label>
              <Input
                id="imageUrl"
                value={config.imageUrl || ''}
                onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
                placeholder="https://"
              />
            </div>
            <div>
              <Label htmlFor="linkUrl">跳转链接</Label>
              <Input
                id="linkUrl"
                value={config.linkUrl || ''}
                onChange={(e) => setConfig({ ...config, linkUrl: e.target.value })}
                placeholder="/products 或 https://"
              />
            </div>
            <div>
              <Label htmlFor="type">横幅类型</Label>
              <Select value={config.type || 'full'} onValueChange={(v) => setConfig({ ...config, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">全宽横幅</SelectItem>
                  <SelectItem value="half">半宽横幅</SelectItem>
                  <SelectItem value="card">卡片样式</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bgColor">背景颜色</Label>
              <Input
                id="bgColor"
                value={config.bgColor || '#ffffff'}
                onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                type="color"
              />
            </div>
            <div>
              <Label htmlFor="textColor">文字颜色</Label>
              <Input
                id="textColor"
                value={config.textColor || '#000000'}
                onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                type="color"
              />
            </div>
          </div>
        );

      case 'category-nav':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">模块标题</Label>
              <Input
                id="title"
                value={config.title || '热门分类'}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="displayType">显示方式</Label>
              <Select
                value={config.displayType || 'grid'}
                onValueChange={(v) => setConfig({ ...config, displayType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">网格展示</SelectItem>
                  <SelectItem value="carousel">轮播展示</SelectItem>
                  <SelectItem value="list">列表展示</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="limit">显示数量</Label>
              <Input
                id="limit"
                type="number"
                value={config.limit || 8}
                onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) })}
                min={4}
                max={20}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showIcon" className="font-normal">
                显示分类图标
              </Label>
              <Switch
                id="showIcon"
                checked={config.showIcon !== false}
                onCheckedChange={(checked) => setConfig({ ...config, showIcon: checked })}
              />
            </div>
          </div>
        );

      case 'banner':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                轮播图需要在 <strong>轮播图管理</strong> 页面进行配置。
              </p>
              <Button
                variant="link"
                className="mt-2 p-0 text-blue-600"
                onClick={() => window.open('/admin/home-config/banners', '_blank')}
              >
                前往轮播图管理 →
              </Button>
            </div>
            <div>
              <Label htmlFor="autoplay">自动播放</Label>
              <Switch
                id="autoplay"
                checked={config.autoplay !== false}
                onCheckedChange={(checked) => setConfig({ ...config, autoplay: checked })}
              />
            </div>
            <div>
              <Label htmlFor="interval">切换间隔（秒）</Label>
              <Input
                id="interval"
                type="number"
                value={config.interval || 5}
                onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) })}
                min={3}
                max={10}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="py-8 text-center text-gray-500">
            <p>该模块类型暂无可配置项</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑模块配置</DialogTitle>
          <DialogDescription>配置 {module.type} 模块的显示内容和样式</DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderConfigForm()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>保存配置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HomeConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<HomePageModule[]>([]);
  const [configId, setConfigId] = useState<string>('');
  const [editingModule, setEditingModule] = useState<HomePageModule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 加载配置
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchConfig();
  }, [status]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/home-config');
      const result = await response.json();

      if (result.success && result.data) {
        setConfigId(result.data.id || '');
        setModules(result.data.modules || []);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // 更新 order 字段
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
      toast.success('模块顺序已调整');
    }
  };

  // 添加新模块
  const addModule = (type: HomePageModule['type']) => {
    const newModule: HomePageModule = {
      id: `module-${Date.now()}`,
      type,
      order: modules.length + 1,
      enabled: true,
      config: getDefaultConfig(type),
    };

    setModules([...modules, newModule]);
    toast.success('模块已添加，请配置相关信息');
    
    // 自动打开编辑对话框
    setEditingModule(newModule);
    setDialogOpen(true);
  };

  // 获取默认配置
  const getDefaultConfig = (type: HomePageModule['type']) => {
    switch (type) {
      case 'product-section':
        return {
          id: `config-${Date.now()}`,
          title: '热销商品',
          subtitle: '精选好货，品质保证',
          type: 'featured',
          limit: 10,
          layout: 'grid',
          columns: 5,
          showPrice: true,
          showRating: true,
          showDiscount: true,
          order: 1,
          enabled: true,
        } as ProductSectionConfig;
      case 'promo-banner':
        return {
          id: `config-${Date.now()}`,
          title: '限时促销',
          description: '全场低至5折，限时抢购',
          type: 'full',
          bgColor: '#ff6b6b',
          textColor: '#ffffff',
          order: 1,
          enabled: true,
        } as PromoBannerConfig;
      case 'banner':
        return {
          autoplay: true,
          interval: 5,
        };
      case 'category-nav':
        return {
          title: '热门分类',
          displayType: 'grid',
          limit: 8,
          showIcon: true,
        };
      default:
        return {};
    }
  };

  // 删除模块
  const deleteModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id));
    toast.success('模块已删除');
  };

  // 切换模块启用状态
  const toggleModule = (id: string, enabled: boolean) => {
    setModules(modules.map((m) => (m.id === id ? { ...m, enabled } : m)));
    toast.success(enabled ? '模块已启用' : '模块已禁用');
  };

  // 编辑模块
  const editModule = (module: HomePageModule) => {
    setEditingModule(module);
    setDialogOpen(true);
  };

  // 保存模块配置
  const saveModuleConfig = (config: any) => {
    if (!editingModule) return;

    setModules(
      modules.map((m) =>
        m.id === editingModule.id
          ? { ...m, config }
          : m
      )
    );
    toast.success('模块配置已更新');
  };

  // 保存整体配置
  const saveConfig = async () => {
    try {
      setSaving(true);

      const method = configId ? 'PUT' : 'POST';
      const body = configId ? { id: configId, modules } : { modules };

      const response = await fetch('/api/admin/home-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('保存成功！首页配置已更新');
        if (result.data?.id) {
          setConfigId(result.data.id);
        }
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <HomeConfigSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto space-y-6 p-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">首页配置</h1>
            <p className="mt-1 text-gray-500">拖拽调整模块顺序，自由配置首页布局 · 当前共 {modules.length} 个模块</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/', '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              预览首页
            </Button>
            <Button onClick={saveConfig} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 提示信息 */}
        {modules.length === 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
            <p className="text-blue-800">
              👋 欢迎使用首页配置！从右侧添加模块开始构建您的电商首页
            </p>
          </div>
        )}

        {/* 主要内容 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左侧：模块列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>页面模块</CardTitle>
                <CardDescription>
                  拖拽 <GripVertical className="inline h-4 w-4" /> 图标调整模块顺序
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {modules.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <Package className="mx-auto mb-4 h-12 w-12" />
                    <p className="text-lg">暂无模块</p>
                    <p className="mt-1 text-sm">请从右侧添加模块</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={modules} strategy={verticalListSortingStrategy}>
                      {modules.map((module) => (
                        <SortableModuleItem
                          key={module.id}
                          module={module}
                          onEdit={() => editModule(module)}
                          onDelete={() => deleteModule(module.id)}
                          onToggle={(enabled) => toggleModule(module.id, enabled)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：添加模块 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>添加模块</CardTitle>
                <CardDescription>选择要添加的模块类型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-blue-600 hover:bg-blue-50"
                  onClick={() => addModule('banner')}
                >
                  <Image className="mr-2 h-4 w-4" />
                  轮播图
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-purple-600 hover:bg-purple-50"
                  onClick={() => addModule('category-nav')}
                >
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  分类导航
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600 hover:bg-green-50"
                  onClick={() => addModule('product-section')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  商品模块
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-orange-600 hover:bg-orange-50"
                  onClick={() => addModule('promo-banner')}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  促销横幅
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-pink-600 hover:bg-pink-50"
                  onClick={() => addModule('brand-showcase')}
                >
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  品牌展示
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-indigo-600 hover:bg-indigo-50"
                  onClick={() => addModule('content-cards')}
                >
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  内容卡片
                </Button>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>快速跳转</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/home-config/banners')}
                >
                  管理轮播图
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/categories')}
                >
                  管理分类
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/products')}
                >
                  管理商品
                </Button>
              </CardContent>
            </Card>

            {/* 使用提示 */}
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm text-green-800">💡 使用提示</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-green-700">
                <p>• 商品模块支持多种数据源和布局</p>
                <p>• 促销横幅可配置颜色和样式</p>
                <p>• 拖拽模块调整显示顺序</p>
                <p>• 禁用模块不会删除配置</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 模块编辑对话框 */}
      <ModuleEditDialog
        open={dialogOpen}
        module={editingModule}
        onClose={() => {
          setDialogOpen(false);
          setEditingModule(null);
        }}
        onSave={saveModuleConfig}
      />
    </AdminLayout>
  );
}
