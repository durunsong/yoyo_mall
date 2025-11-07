'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { TableSkeleton } from '@/components/admin/admin-skeleton';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, GripVertical, Trash2, Save, Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  altText?: string | null;
  sortOrder: number;
  isActive: boolean;
}

// 可拖拽的轮播图项组件
function SortableBannerItem({
  banner,
  onEdit,
  onDelete,
  onToggle,
}: {
  banner: Banner;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-white p-4"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="relative h-20 w-32 overflow-hidden rounded">
        <Image
          src={banner.imageUrl}
          alt={banner.altText || '轮播图'}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1">
        <p className="font-medium">{banner.altText || '未命名'}</p>
        {banner.linkUrl && (
          <p className="text-sm text-gray-500">链接: {banner.linkUrl}</p>
        )}
      </div>

      <Switch checked={banner.isActive} onCheckedChange={onToggle} />

      <Button variant="outline" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

export default function HomeBannersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 新轮播图表单数据
  const [newBanner, setNewBanner] = useState({
    imageUrl: '',
    linkUrl: '',
    altText: '',
  });

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 权限验证
  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    
    if (!session || !isAdmin) {
      router.push('/');
    }
  }, [session, status, router]);

  // 加载轮播图
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchBanners();
  }, [status]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/home-banners');
      const result = await response.json();

      if (result.success && result.data) {
        setBanners(result.data);
      }
    } catch (error) {
      console.error('加载轮播图失败:', error);
      toast.error('加载轮播图失败');
    } finally {
      setLoading(false);
    }
  };

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // 更新 sortOrder
        return newItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        }));
      });
    }
  };

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.url) {
        setNewBanner({ ...newBanner, imageUrl: result.url });
        toast.success('图片上传成功');
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 创建轮播图
  const createBanner = async () => {
    if (!newBanner.imageUrl) {
      toast.error('请上传图片');
      return;
    }

    try {
      const response = await fetch('/api/admin/home-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newBanner.imageUrl,
          linkUrl: newBanner.linkUrl || '',
          altText: newBanner.altText || '',
          sortOrder: banners.length,
          isActive: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('创建成功');
        setDialogOpen(false);
        setNewBanner({ imageUrl: '', linkUrl: '', altText: '' });
        fetchBanners();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建轮播图失败:', error);
      toast.error('创建失败');
    }
  };

  // 删除轮播图
  const deleteBanner = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/home-banners?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('删除成功');
        fetchBanners();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除轮播图失败:', error);
      toast.error('删除失败');
    }
  };

  // 切换轮播图状态
  const toggleBanner = (id: string, isActive: boolean) => {
    setBanners(banners.map((b) => (b.id === id ? { ...b, isActive } : b)));
  };

  // 保存顺序
  const saveOrder = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/home-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('保存成功');
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton-wave h-10 w-10 rounded" />
              <div>
                <div className="skeleton-wave mb-2 h-9 w-32 rounded" />
                <div className="skeleton-wave h-5 w-48 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="skeleton-wave h-10 w-28 rounded" />
              <div className="skeleton-wave h-10 w-24 rounded" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <div className="skeleton-wave h-6 w-32 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-white p-4">
                  <div className="skeleton-wave h-5 w-5 rounded" />
                  <div className="skeleton-wave h-20 w-32 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-wave h-5 w-32 rounded" />
                    <div className="skeleton-wave h-4 w-48 rounded" />
                  </div>
                  <div className="skeleton-wave h-6 w-12 rounded-full" />
                  <div className="skeleton-wave h-8 w-8 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto space-y-6 p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">轮播图管理</h1>
            <p className="mt-1 text-gray-500">管理首页轮播图，拖拽调整顺序</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加轮播图
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加轮播图</DialogTitle>
                <DialogDescription>上传图片并设置链接</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="image">图片 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  {newBanner.imageUrl && (
                    <div className="relative h-40 w-full overflow-hidden rounded">
                      <Image
                        src={newBanner.imageUrl}
                        alt="预览"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altText">标题</Label>
                  <Input
                    id="altText"
                    value={newBanner.altText}
                    onChange={(e) => setNewBanner({ ...newBanner, altText: e.target.value })}
                    placeholder="输入轮播图标题"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">跳转链接</Label>
                  <Input
                    id="linkUrl"
                    value={newBanner.linkUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                    placeholder="输入跳转链接（可选）"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={createBanner} disabled={!newBanner.imageUrl}>
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={saveOrder} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存顺序
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 轮播图列表 */}
      <Card>
        <CardHeader>
          <CardTitle>轮播图列表 ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {banners.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>暂无轮播图，点击右上角添加</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={banners} strategy={verticalListSortingStrategy}>
                {banners.map((banner) => (
                  <SortableBannerItem
                    key={banner.id}
                    banner={banner}
                    onEdit={() => {
                      toast.info('编辑功能开发中...');
                    }}
                    onDelete={() => deleteBanner(banner.id)}
                    onToggle={(isActive) => toggleBanner(banner.id, isActive)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}

