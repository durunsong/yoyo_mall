/**
 * 用户地址管理页面
 * 实现地址的增删改查和设置默认地址功能
 * 包括:地址列表、添加地址、编辑地址、删除地址、设为默认
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Star,
  Loader2,
  Home as HomeIcon,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

// 地址类型枚举
type AddressType = 'SHIPPING' | 'BILLING';

// 地址接口定义
interface Address {
  id: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    type: 'SHIPPING' as AddressType,
    firstName: '',
    lastName: '',
    company: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // 加载地址列表
  useEffect(() => {
    if (session?.user) {
      fetchAddresses();
    }
  }, [session]);

  // 获取地址列表
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/addresses');
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error('加载地址列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      type: 'SHIPPING',
      firstName: '',
      lastName: '',
      company: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      phone: '',
    });
  };

  // 打开添加对话框
  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (address: Address) => {
    setSelectedAddress(address);
    setFormData({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
    });
    setIsEditDialogOpen(true);
  };

  // 添加地址
  const handleAddAddress = async () => {
    try {
      setSubmitting(true);

      // 验证必填字段
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.addressLine1 ||
        !formData.city ||
        !formData.state ||
        !formData.postalCode ||
        !formData.country
      ) {
        toast.error('请填写所有必填字段');
        return;
      }

      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('地址添加成功');
        setIsAddDialogOpen(false);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.error || '添加地址失败');
      }
    } catch (error) {
      console.error('Failed to add address:', error);
      toast.error('添加地址失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 更新地址
  const handleUpdateAddress = async () => {
    if (!selectedAddress) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/user/addresses/${selectedAddress.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('地址更新成功');
        setIsEditDialogOpen(false);
        setSelectedAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.error || '更新地址失败');
      }
    } catch (error) {
      console.error('Failed to update address:', error);
      toast.error('更新地址失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除地址
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('确定要删除这个地址吗?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('地址删除成功');
        fetchAddresses();
      } else {
        toast.error(data.error || '删除地址失败');
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('删除地址失败');
    }
  };

  // 设为默认地址
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${id}/set-default`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('已设为默认地址');
        fetchAddresses();
      } else {
        toast.error(data.error || '设置默认地址失败');
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('设置默认地址失败');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">地址管理</h1>
        <p className="mt-1 text-gray-600">管理您的收货和账单地址</p>
      </div>

      {/* 添加地址按钮 */}
      <div className="mb-6">
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          添加新地址
        </Button>
      </div>

      {/* 地址列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-500">暂无地址,点击上方按钮添加新地址</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {address.type === 'SHIPPING' ? (
                      <HomeIcon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Building className="h-4 w-4 text-purple-600" />
                    )}
                    <CardTitle className="text-base">
                      {address.type === 'SHIPPING' ? '收货地址' : '账单地址'}
                    </CardTitle>
                  </div>
                  {address.isDefault && (
                    <Badge variant="default" className="gap-1">
                      <Star className="h-3 w-3" />
                      默认
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {address.firstName} {address.lastName}
                  </p>
                  {address.company && (
                    <p className="text-gray-600">{address.company}</p>
                  )}
                  <p className="text-gray-600">{address.addressLine1}</p>
                  {address.addressLine2 && (
                    <p className="text-gray-600">{address.addressLine2}</p>
                  )}
                  <p className="text-gray-600">
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p className="text-gray-600">{address.country}</p>
                  {address.phone && (
                    <p className="text-gray-600">电话: {address.phone}</p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="mt-4 flex gap-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <Star className="mr-1 h-3 w-3" />
                      设为默认
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(address)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3 text-red-600" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 添加地址对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加新地址</DialogTitle>
            <DialogDescription>填写地址信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">地址类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value: AddressType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHIPPING">收货地址</SelectItem>
                  <SelectItem value="BILLING">账单地址</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">名 *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="张"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">姓 *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="三"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">公司(可选)</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="公司名称"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="addressLine1">地址行1 *</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
                placeholder="街道地址"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="addressLine2">地址行2(可选)</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
                placeholder="公寓、套房等"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">城市 *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="城市"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">省/州 *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="省份或州"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="postalCode">邮编 *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  placeholder="邮政编码"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">国家 *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">美国</SelectItem>
                    <SelectItem value="CN">中国</SelectItem>
                    <SelectItem value="GB">英国</SelectItem>
                    <SelectItem value="CA">加拿大</SelectItem>
                    <SelectItem value="AU">澳大利亚</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">电话(可选)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+86 138 0000 0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleAddAddress} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                '添加地址'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑地址对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑地址</DialogTitle>
            <DialogDescription>修改地址信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-type">地址类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value: AddressType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHIPPING">收货地址</SelectItem>
                  <SelectItem value="BILLING">账单地址</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstName">名 *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="张"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lastName">姓 *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="三"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-company">公司(可选)</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="公司名称"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-addressLine1">地址行1 *</Label>
              <Input
                id="edit-addressLine1"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
                placeholder="街道地址"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-addressLine2">地址行2(可选)</Label>
              <Input
                id="edit-addressLine2"
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
                placeholder="公寓、套房等"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-city">城市 *</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="城市"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-state">省/州 *</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="省份或州"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-postalCode">邮编 *</Label>
                <Input
                  id="edit-postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  placeholder="邮政编码"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-country">国家 *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">美国</SelectItem>
                    <SelectItem value="CN">中国</SelectItem>
                    <SelectItem value="GB">英国</SelectItem>
                    <SelectItem value="CA">加拿大</SelectItem>
                    <SelectItem value="AU">澳大利亚</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-phone">电话(可选)</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+86 138 0000 0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleUpdateAddress} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新地址'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


