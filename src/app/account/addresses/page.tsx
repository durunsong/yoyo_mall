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
import { useStaticTranslations } from '@/hooks/use-i18n';

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
  const { t } = useStaticTranslations('account');
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
      toast.error(t('addresses.toasts.loadFailed'));
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
        toast.error(t('addresses.toasts.missingFields'));
        return;
      }

      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('addresses.toasts.addSuccess'));
        setIsAddDialogOpen(false);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.error || t('addresses.toasts.addFailed'));
      }
    } catch (error) {
      console.error('Failed to add address:', error);
      toast.error(t('addresses.toasts.addFailed'));
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
        toast.success(t('addresses.toasts.updateSuccess'));
        setIsEditDialogOpen(false);
        setSelectedAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        toast.error(data.error || t('addresses.toasts.updateFailed'));
      }
    } catch (error) {
      console.error('Failed to update address:', error);
      toast.error(t('addresses.toasts.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // 删除地址
  const handleDeleteAddress = async (id: string) => {
    if (!confirm(t('addresses.deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('addresses.toasts.deleteSuccess'));
        fetchAddresses();
      } else {
        toast.error(data.error || t('addresses.toasts.deleteFailed'));
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error(t('addresses.toasts.deleteFailed'));
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
        toast.success(t('addresses.toasts.setDefaultSuccess'));
        fetchAddresses();
      } else {
        toast.error(data.error || t('addresses.toasts.setDefaultFailed'));
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error(t('addresses.toasts.setDefaultFailed'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('addresses.pageTitle')}</h1>
        <p className="mt-1 text-gray-600">{t('addresses.pageSubtitle')}</p>
      </div>

      {/* 添加地址按钮 */}
      <div className="mb-6">
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addresses.addAddress')}
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
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t('addresses.emptyTitle')}
            </h3>
            <p className="text-gray-500">{t('addresses.emptyDescription')}</p>
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
                      {t(`addresses.types.${address.type.toLowerCase() as 'shipping' | 'billing'}`)}
                    </CardTitle>
                  </div>
                  {address.isDefault && (
                    <Badge variant="default" className="gap-1">
                      <Star className="h-3 w-3" />
                      {t('addresses.defaultBadge')}
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
                    <p className="text-gray-600">{t('addresses.fields.phone')}: {address.phone}</p>
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
                      {t('addresses.setDefault')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(address)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    {t('addresses.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3 text-red-600" />
                    {t('addresses.delete')}
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
            <DialogTitle>{t('addresses.addAddress')}</DialogTitle>
            <DialogDescription>{t('addresses.pageSubtitle')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">{t('addresses.fields.type')}</Label>
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
                <Label htmlFor="firstName">{t('addresses.fields.firstName')} *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">{t('addresses.fields.lastName')} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">{t('addresses.fields.company')}</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="addressLine1">{t('addresses.fields.addressLine1')} *</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="addressLine2">{t('addresses.fields.addressLine2')}</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">{t('addresses.fields.city')} *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">{t('addresses.fields.state')} *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="postalCode">{t('addresses.fields.postalCode')} *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">{t('addresses.fields.country')} *</Label>
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
              <Label htmlFor="phone">{t('addresses.fields.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={handleAddAddress} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.submitting', { defaultValue: 'Submitting...' })}
                </>
              ) : (
                t('addresses.addAddress')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑地址对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addresses.editAddress')}</DialogTitle>
            <DialogDescription>{t('addresses.pageSubtitle')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-type">{t('addresses.fields.type')}</Label>
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
                  <SelectItem value="SHIPPING">{t('addresses.types.shipping')}</SelectItem>
                  <SelectItem value="BILLING">{t('addresses.types.billing')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstName">{t('addresses.fields.firstName')} *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lastName">{t('addresses.fields.lastName')} *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-company">{t('addresses.fields.company')}</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-addressLine1">{t('addresses.fields.addressLine1')} *</Label>
              <Input
                id="edit-addressLine1"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-addressLine2">{t('addresses.fields.addressLine2')}</Label>
              <Input
                id="edit-addressLine2"
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-city">{t('addresses.fields.city')} *</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-state">{t('addresses.fields.state')} *</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-postalCode">{t('addresses.fields.postalCode')} *</Label>
                <Input
                  id="edit-postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-country">{t('addresses.fields.country')} *</Label>
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
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CN">China</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-phone">{t('addresses.fields.phone')}</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={handleUpdateAddress} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.updating', { defaultValue: 'Updating...' })}
                </>
              ) : (
                t('common.save', { defaultValue: 'Save' })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


