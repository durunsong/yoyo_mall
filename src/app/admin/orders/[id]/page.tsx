/**
 * 订单详情页面
 * 显示订单的完整信息,包括商品清单、配送信息、支付信息和操作历史
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// 订单状态类型
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

// 订单接口
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: string;
      name: string;
      images?: Array<{ url: string }>;
    };
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  payment?: {
    id: string;
    method: string;
    status: string;
    transactionId?: string;
    createdAt: string;
  };
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 加载订单详情
  useEffect(() => {
    fetchOrderDetail();
  }, [params.id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
      } else {
        toast.error('加载订单详情失败');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('加载订单详情失败');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  // 更新订单状态
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('订单状态更新成功');
        fetchOrderDetail();
      } else {
        toast.error(data.error || '更新订单状态失败');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('更新订单状态失败');
    } finally {
      setUpdating(false);
    }
  };

  // 获取状态Badge颜色
  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'CONFIRMED':
        return 'default';
      case 'PROCESSING':
        return 'default';
      case 'SHIPPED':
        return 'default';
      case 'DELIVERED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      case 'REFUNDED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // 获取状态文本
  const getStatusText = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
      PENDING: '待处理',
      CONFIRMED: '已确认',
      PROCESSING: '处理中',
      SHIPPED: '已发货',
      DELIVERED: '已送达',
      CANCELLED: '已取消',
      REFUNDED: '已退款',
    };
    return statusMap[status] || status;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 格式化金额
  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">订单不存在</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/orders')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">订单详情</h1>
              <p className="text-gray-600 mt-1">订单号: {order.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1">
              {getStatusText(order.status)}
            </Badge>
            <Select
              value={order.status}
              onValueChange={(value) => handleUpdateStatus(value as OrderStatus)}
              disabled={updating}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="更新状态" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 商品清单 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  商品清单
                </CardTitle>
                <CardDescription>共 {order.items.length} 件商品</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-center">数量</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                      <TableHead className="text-right">小计</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded border">
                              {item.product.images?.[0]?.url ? (
                                <Image
                                  src={item.product.images[0].url}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">×{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                {/* 价格汇总 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">商品小计</span>
                    <span>{formatPrice(order.totalAmount - order.shippingFee - order.taxAmount + order.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">运费</span>
                    <span>{formatPrice(order.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">税费</span>
                    <span>{formatPrice(order.taxAmount)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>优惠</span>
                      <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>订单总额</span>
                    <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 配送信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  配送信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">收货人</div>
                    <div className="font-medium">{order.shippingAddress.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">联系电话</div>
                    <div className="font-medium">{order.shippingAddress.phone}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">收货地址</div>
                  <div className="font-medium">
                    {order.shippingAddress.country} {order.shippingAddress.state}{' '}
                    {order.shippingAddress.city} {order.shippingAddress.address}{' '}
                    {order.shippingAddress.postalCode}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧信息栏 */}
          <div className="space-y-6">
            {/* 客户信息 */}
            <Card>
              <CardHeader>
                <CardTitle>客户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">客户姓名</div>
                  <div className="font-medium">{order.user.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">邮箱</div>
                  <div className="font-medium text-sm">{order.user.email}</div>
                </div>
              </CardContent>
            </Card>

            {/* 支付信息 */}
            {order.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    支付信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">支付方式</div>
                    <div className="font-medium">{order.payment.method}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">支付状态</div>
                    <Badge variant={order.payment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {order.payment.status === 'COMPLETED' ? '已支付' : '未支付'}
                    </Badge>
                  </div>
                  {order.payment.transactionId && (
                    <div>
                      <div className="text-sm text-gray-600">交易号</div>
                      <div className="font-mono text-sm">{order.payment.transactionId}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600">支付时间</div>
                    <div className="text-sm">{formatDate(order.payment.createdAt)}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 订单时间线 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  订单时间线
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">订单创建</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  {order.status !== 'PENDING' && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">状态更新</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.updatedAt)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          当前状态: {getStatusText(order.status)}
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status === 'SHIPPED' && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Truck className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">已发货</div>
                        <div className="text-sm text-gray-500">
                          商品正在配送中
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status === 'DELIVERED' && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">已送达</div>
                        <div className="text-sm text-gray-500">
                          订单已完成
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status === 'CANCELLED' && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">已取消</div>
                        <div className="text-sm text-gray-500">
                          订单已取消
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

