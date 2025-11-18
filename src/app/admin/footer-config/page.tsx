/**
 * Footer配置管理页面
 * 管理网站底部Footer的所有配置（区块、链接、联系信息、社交媒体）
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/admin-layout';
import { FooterConfigSkeleton } from '@/components/admin/admin-skeleton';

// 类型定义
interface FooterLink {
  id: string;
  sectionId: string;
  name: string;
  nameEn?: string;
  nameZh?: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
  openInNew: boolean;
}

interface FooterSection {
  id: string;
  key: string;
  title: string;
  titleEn?: string;
  titleZh?: string;
  sortOrder: number;
  isActive: boolean;
  links: FooterLink[];
}

// interface FooterContact {
//   id: string;
//   type: string;
//   label: string;
//   labelEn?: string;
//   labelZh?: string;
//   value: string;
//   icon?: string;
//   sortOrder: number;
//   isActive: boolean;
// }

// interface FooterSocial {
//   id: string;
//   name: string;
//   icon: string;
//   href: string;
//   color?: string;
//   sortOrder: number;
//   isActive: boolean;
// }

export default function FooterConfigPage() {
  const [sections, setSections] = useState<FooterSection[]>([]);
  // const [contacts, setContacts] = useState<FooterContact[]>([]);
  // const [socials, setSocials] = useState<FooterSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sections'); // sections, contacts, socials
  
  // 对话框状态
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<FooterSection | null>(null);
  const [currentLink, setCurrentLink] = useState<Partial<FooterLink>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/footer-sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('加载Footer配置失败:', error);
      toast.error('加载Footer配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换区块展开/折叠
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // 创建/更新区块
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSection) return;

    try {
      const url = currentSection.id
        ? `/api/admin/footer-sections/${currentSection.id}`
        : '/api/admin/footer-sections';
      
      const method = currentSection.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSection),
      });

      if (response.ok) {
        toast.success(currentSection.id ? '区块更新成功' : '区块创建成功');
        setSectionDialogOpen(false);
        setCurrentSection(null);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || '操作失败');
      }
    } catch (error) {
      console.error('保存区块失败:', error);
      toast.error('保存区块失败');
    }
  };

  // 创建/更新链接
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLink.sectionId) return;

    try {
      const url = currentLink.id
        ? `/api/admin/footer-links/${currentLink.id}`
        : '/api/admin/footer-links';
      
      const method = currentLink.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLink),
      });

      if (response.ok) {
        toast.success(currentLink.id ? '链接更新成功' : '链接创建成功');
        setLinkDialogOpen(false);
        setCurrentLink({});
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || '操作失败');
      }
    } catch (error) {
      console.error('保存链接失败:', error);
      toast.error('保存链接失败');
    }
  };

  // 删除区块
  const handleDeleteSection = async (id: string) => {
    if (!confirm('确定要删除此区块吗？这将同时删除该区块下的所有链接。')) return;

    try {
      const response = await fetch(`/api/admin/footer-sections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('区块删除成功');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除区块失败:', error);
      toast.error('删除区块失败');
    }
  };

  // 删除链接
  const handleDeleteLink = async (id: string) => {
    if (!confirm('确定要删除此链接吗？')) return;

    try {
      const response = await fetch(`/api/admin/footer-links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('链接删除成功');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      console.error('删除链接失败:', error);
      toast.error('删除链接失败');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <FooterConfigSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Footer配置管理</CardTitle>
              <CardDescription className="mt-1">
                管理网站底部的区块、链接、联系信息和社交媒体
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setCurrentSection({
                  id: '',
                  key: '',
                  title: '',
                  titleEn: '',
                  titleZh: '',
                  sortOrder: sections.length,
                  isActive: true,
                  links: [],
                });
                setSectionDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              添加区块
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 标签页导航 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sections">Footer区块</TabsTrigger>
          <TabsTrigger value="contacts">联系信息</TabsTrigger>
          <TabsTrigger value="socials">社交媒体</TabsTrigger>
        </TabsList>

        {/* Footer区块标签页 */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Footer区块列表</CardTitle>
              <CardDescription>
                管理Footer的区块和链接，共 {sections.length} 个区块
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Footer区块列表 */}
              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.id} className="rounded-lg border bg-card">
                    {/* 区块头部 */}
                    <div className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection(section.id)}
                        >
                          {expandedSections.has(section.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <div className="flex items-center space-x-2 font-semibold">
                            <span>{section.title}</span>
                            <Badge variant={section.isActive ? 'default' : 'secondary'}>
                              {section.isActive ? '激活' : '禁用'}
                            </Badge>
                            <Badge variant="outline">{section.key}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {section.links.length} 个链接 | 排序: {section.sortOrder}
                          </div>
                        </div>
                      </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentLink({
                        sectionId: section.id,
                        name: '',
                        nameEn: '',
                        nameZh: '',
                        href: '',
                        sortOrder: section.links.length,
                        isActive: true,
                        openInNew: false,
                      });
                      setLinkDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    添加链接
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentSection(section);
                      setSectionDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                      </div>
                    </div>
                    
                    {/* 链接列表 */}
                    {expandedSections.has(section.id) && (
                      <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>链接</TableHead>
                      <TableHead>排序</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.links.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          暂无链接
                        </TableCell>
                      </TableRow>
                    ) : (
                      section.links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell className="font-medium">
                            {link.name}
                            {link.openInNew && (
                              <ExternalLink className="ml-1 inline h-3 w-3" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {link.href}
                          </TableCell>
                          <TableCell>{link.sortOrder}</TableCell>
                          <TableCell>
                            <Badge variant={link.isActive ? 'default' : 'secondary'}>
                              {link.isActive ? '激活' : '禁用'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentLink(link);
                                  setLinkDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLink(link.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                          )}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                  </div>
                ))}

                {sections.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    暂无Footer区块，点击上方&ldquo;添加区块&rdquo;按钮开始创建
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 联系信息标签页 */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>联系信息</CardTitle>
              <CardDescription>
                管理Footer的联系方式（邮箱、电话、地址等）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                联系信息管理功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 社交媒体标签页 */}
        <TabsContent value="socials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>社交媒体链接</CardTitle>
              <CardDescription>
                管理Footer的社交媒体图标和链接
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                社交媒体管理功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 区块编辑对话框 */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSaveSection}>
            <DialogHeader>
              <DialogTitle>
                {currentSection?.id ? '编辑区块' : '新建区块'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="key">区块Key (唯一标识)</Label>
                <Input
                  id="key"
                  value={currentSection?.key || ''}
                  onChange={(e) => setCurrentSection(prev => 
                    prev ? { ...prev, key: e.target.value } : null
                  )}
                  placeholder="例如: company, customer, account, legal"
                  disabled={!!currentSection?.id}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">标题（默认）</Label>
                <Input
                  id="title"
                  value={currentSection?.title || ''}
                  onChange={(e) => setCurrentSection(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                  placeholder="例如: 公司信息"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="titleEn">英文标题</Label>
                  <Input
                    id="titleEn"
                    value={currentSection?.titleEn || ''}
                    onChange={(e) => setCurrentSection(prev => 
                      prev ? { ...prev, titleEn: e.target.value } : null
                    )}
                    placeholder="例如: Company"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="titleZh">中文标题</Label>
                  <Input
                    id="titleZh"
                    value={currentSection?.titleZh || ''}
                    onChange={(e) => setCurrentSection(prev => 
                      prev ? { ...prev, titleZh: e.target.value } : null
                    )}
                    placeholder="例如: 公司"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sortOrder">排序</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={currentSection?.sortOrder || 0}
                    onChange={(e) => setCurrentSection(prev => 
                      prev ? { ...prev, sortOrder: parseInt(e.target.value) } : null
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="isActive"
                    checked={currentSection?.isActive || false}
                    onCheckedChange={(checked) => setCurrentSection(prev => 
                      prev ? { ...prev, isActive: checked } : null
                    )}
                  />
                  <Label htmlFor="isActive">激活此区块</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSectionDialogOpen(false);
                  setCurrentSection(null);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 链接编辑对话框 */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSaveLink}>
            <DialogHeader>
              <DialogTitle>
                {currentLink?.id ? '编辑链接' : '新建链接'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">链接名称（默认）</Label>
                <Input
                  id="name"
                  value={currentLink?.name || ''}
                  onChange={(e) => setCurrentLink(prev => 
                    ({ ...prev, name: e.target.value })
                  )}
                  placeholder="例如: 关于我们"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nameEn">英文名称</Label>
                  <Input
                    id="nameEn"
                    value={currentLink?.nameEn || ''}
                    onChange={(e) => setCurrentLink(prev => 
                      ({ ...prev, nameEn: e.target.value })
                    )}
                    placeholder="例如: About Us"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nameZh">中文名称</Label>
                  <Input
                    id="nameZh"
                    value={currentLink?.nameZh || ''}
                    onChange={(e) => setCurrentLink(prev => 
                      ({ ...prev, nameZh: e.target.value })
                    )}
                    placeholder="例如: 关于我们"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="href">链接地址</Label>
                <Input
                  id="href"
                  value={currentLink?.href || ''}
                  onChange={(e) => setCurrentLink(prev => 
                    ({ ...prev, href: e.target.value })
                  )}
                  placeholder="例如: /about 或 https://example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="linkSortOrder">排序</Label>
                  <Input
                    id="linkSortOrder"
                    type="number"
                    value={currentLink?.sortOrder || 0}
                    onChange={(e) => setCurrentLink(prev => 
                      ({ ...prev, sortOrder: parseInt(e.target.value) })
                    )}
                  />
                </div>

                <div className="flex flex-col space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="linkIsActive"
                      checked={currentLink?.isActive !== false}
                      onCheckedChange={(checked) => setCurrentLink(prev => 
                        ({ ...prev, isActive: checked })
                      )}
                    />
                    <Label htmlFor="linkIsActive">激活</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="openInNew"
                      checked={currentLink?.openInNew || false}
                      onCheckedChange={(checked) => setCurrentLink(prev => 
                        ({ ...prev, openInNew: checked })
                      )}
                    />
                    <Label htmlFor="openInNew">新窗口打开</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLinkDialogOpen(false);
                  setCurrentLink({});
                }}
              >
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}

