/**
 * 订单管理页面
 * 实现订单的查看、搜索、筛选和状态更新功能
 * 包括:订单列表、订单详情、状态更新、物流信息
 */

'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActions } from '@/components/admin/bulk-actions';
import { ExportButton } from '@/components/admin/export-button';
import { useRouter } from 'next/navigation';

// 订单接口定义
interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  currency: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  items?: Array<{
    id: string;
    productSnapshot: any;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('PENDING');
  const [updating, setUpdating] = useState(false);

  // 加载订单列表
  useEffect(() => {
    fetchOrders();
  }, []);

  // 获取订单列表
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders?limit=100');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 筛选订单
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 查看订单详情
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  // 打开更新状态对话框
  const handleOpenUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsUpdateStatusDialogOpen(true);
  };

  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('订单状态更新成功');
        setIsUpdateStatusDialogOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || '更新订单状态失败');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('更新订单状态失败');
    } finally {
      setUpdating(false);
    }
  };

  // 切换订单选择
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  // 批量操作处理
  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error('请先选择订单');
      return;
    }

    try {
      let successCount = 0;
      let newStatus: Order['status'] | null = null;

      switch (action) {
        case 'confirm':
          newStatus = 'CONFIRMED';
          break;
        case 'process':
          newStatus = 'PROCESSING';
          break;
        case 'ship':
          newStatus = 'SHIPPED';
          break;
        case 'deliver':
          newStatus = 'DELIVERED';
          break;
        case 'cancel':
          if (!confirm(`确定要取消选中的 ${selectedOrders.length} 个订单吗?`)) {
            return;
          }
          newStatus = 'CANCELLED';
          break;
      }

      if (newStatus) {
        for (const orderId of selectedOrders) {
          const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          if (response.ok) successCount++;
        }
        toast.success(`成功处理 ${successCount} 个订单`);
      }

      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('批量操作失败');
    }
  };

  // 状态Badge颜色和图标
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { variant: 'secondary' as const, icon: Clock, text: '待处理' };
      case 'CONFIRMED':
        return { variant: 'default' as const, icon: CheckCircle, text: '已确认' };
      case 'PROCESSING':
        return { variant: 'default' as const, icon: Package, text: '处理中' };
      case 'SHIPPED':
        return { variant: 'default' as const, icon: Truck, text: '已发货' };
      case 'DELIVERED':
        return { variant: 'default' as const, icon: CheckCircle, text: '已送达' };
      case 'CANCELLED':
        return { variant: 'destructive' as const, icon: XCircle, text: '已取消' };
      case 'REFUNDED':
        return { variant: 'outline' as const, icon: DollarSign, text: '已退款' };
      default:
        return { variant: 'secondary' as const, icon: Clock, text: status };
    }
  };

  // 订单统计
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    processing: orders.filter((o) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'DELIVERED').length,
    totalRevenue: orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页头 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="mt-1 text-gray-600">处理和跟踪所有订单,更新订单状态</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待处理</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">处理中</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已完成</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总营收</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选和搜索 */}
        <Card>
          <CardHeader>
            <CardTitle>订单列表</CardTitle>
            <CardDescription>查看和管理所有订单</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索订单号、客户姓名或邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="PENDING">待处理</SelectItem>
                  <SelectItem value="CONFIRMED">已确认</SelectItem>
                  <SelectItem value="PROCESSING">处理中</SelectItem>
                  <SelectItem value="SHIPPED">已发货</SelectItem>
                  <SelectItem value="DELIVERED">已送达</SelectItem>
                  <SelectItem value="CANCELLED">已取消</SelectItem>
                  <SelectItem value="REFUNDED">已退款</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 批量操作和导出 */}
            {selectedOrders.length > 0 || filteredOrders.length > 0 ? (
              <div className="mb-4 flex items-center gap-2">
                {selectedOrders.length > 0 && (
                  <BulkActions
                    selectedIds={selectedOrders}
                    actions={[
                      { label: '批量确认', value: 'confirm', icon: CheckCircle },
                      { label: '批量发货', value: 'ship', icon: Truck },
                      { label: '批量完成', value: 'deliver', icon: CheckCircle },
                      { label: '批量取消', value: 'cancel', icon: XCircle, variant: 'destructive' },
                    ]}
                    onAction={handleBulkAction}
                  />
                )}
                {filteredOrders.length > 0 && (
                  <ExportButton
                    data={filteredOrders}
                    filename="orders"
                    fields={[
                      { key: 'orderNumber', label: '订单号' },
                      { key: 'user.name', label: '客户姓名' },
                      { key: 'user.email', label: '客户邮箱' },
                      { key: 'totalAmount', label: '订单金额' },
                      { key: 'status', label: '订单状态' },
                      { key: 'createdAt', label: '下单时间' },
                    ]}
                  />
                )}
              </div>
            ) : null}

            {/* 订单表格 */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p>暂无订单</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.length === filteredOrders.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>订单号</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>下单时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {order.user?.name || '未知用户'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.user?.email || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ${order.totalAmount.toFixed(2)}
                            </div>
                            {order.discountAmount > 0 && (
                              <div className="text-sm text-gray-500">
                                优惠 -${order.discountAmount.toFixed(2)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusConfig.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(new Date(order.createdAt))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/orders/${order.id}`)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                详情
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenUpdateStatus(order)}
                              >
                                更新状态
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 订单详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>
              订单号: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* 订单状态 */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-600">订单状态</p>
                  <Badge variant={getStatusConfig(selectedOrder.status).variant} className="mt-1">
                    {getStatusConfig(selectedOrder.status).text}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">下单时间</p>
                  <p className="font-medium">
                    {formatDate(new Date(selectedOrder.createdAt))}
                  </p>
                </div>
              </div>

              {/* 客户信息 */}
              <div>
                <h4 className="mb-2 font-semibold">客户信息</h4>
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="text-sm">
                    <span className="text-gray-600">姓名:</span>{' '}
                    {selectedOrder.user?.name || '未知'}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">邮箱:</span>{' '}
                    {selectedOrder.user?.email || '-'}
                  </p>
                </div>
              </div>

              {/* 配送地址 */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h4 className="mb-2 font-semibold">配送地址</h4>
                  <div className="space-y-1 rounded-lg border p-3">
                    <p className="text-sm">
                      {selectedOrder.shippingAddress.firstName}{' '}
                      {selectedOrder.shippingAddress.lastName}
                    </p>
                    <p className="text-sm">{selectedOrder.shippingAddress.addressLine1}</p>
                    <p className="text-sm">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                    <p className="text-sm">{selectedOrder.shippingAddress.country}</p>
                    {selectedOrder.shippingAddress.phone && (
                      <p className="text-sm">电话: {selectedOrder.shippingAddress.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 订单商品 */}
              <div>
                <h4 className="mb-2 font-semibold">订单商品</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.productSnapshot?.name || '商品'}
                        </p>
                        <p className="text-sm text-gray-600">
                          数量: {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="font-medium">${item.totalPrice.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 订单金额 */}
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">小计</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">运费</span>
                  <span>${selectedOrder.shippingAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">税费</span>
                  <span>${selectedOrder.taxAmount.toFixed(2)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>优惠</span>
                    <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>总计</span>
                  <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更新状态对话框 */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新订单状态</DialogTitle>
            <DialogDescription>
              订单号: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">选择新状态</Label>
              <Select
                value={newStatus}
                onValueChange={(value: Order['status']) => setNewStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">待处理</SelectItem>
                  <SelectItem value="CONFIRMED">已确认</SelectItem>
                  <SelectItem value="PROCESSING">处理中</SelectItem>
                  <SelectItem value="SHIPPED">已发货</SelectItem>
                  <SelectItem value="DELIVERED">已送达</SelectItem>
                  <SelectItem value="CANCELLED">已取消</SelectItem>
                  <SelectItem value="REFUNDED">已退款</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateStatusDialogOpen(false)}
              disabled={updating}
            >
              取消
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新状态'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
