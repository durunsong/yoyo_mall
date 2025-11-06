import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus, ShipmentStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

async function main() {
  console.log('🚀 开始补充订单演示数据...');

  const user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });

  if (!user) {
    throw new Error('未找到测试用户 user@example.com，请先运行基础种子脚本');
  }

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      type: 'SHIPPING',
      firstName: '张',
      lastName: '三',
      company: 'YOYO Mall',
      addressLine1: '上海市浦东新区世纪大道100号',
      addressLine2: 'A 座 18 楼',
      city: '上海',
      state: '上海',
      postalCode: '200120',
      country: 'CN',
      phone: '13800138000',
      isDefault: true,
    },
  });

  console.log('✅ 演示收货地址创建完成');

  const products = await prisma.product.findMany({
    take: 6,
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      inventory: true,
      category: true,
    },
  });

  if (products.length === 0) {
    throw new Error('未找到商品，请先运行基础种子脚本创建商品');
  }

  const orderTemplates = [
    { status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, shipmentStatus: ShipmentStatus.PENDING },
    { status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.COMPLETED, shipmentStatus: ShipmentStatus.PROCESSING },
    { status: OrderStatus.SHIPPED, paymentStatus: PaymentStatus.COMPLETED, shipmentStatus: ShipmentStatus.SHIPPED },
    { status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.COMPLETED, shipmentStatus: ShipmentStatus.DELIVERED },
  ];

  for (let index = 0; index < orderTemplates.length; index += 1) {
    const template = orderTemplates[index];
    const selectedProducts = products.slice(index, index + 2);

    let subtotal = 0;
    const itemsPayload = selectedProducts.map((product, itemIndex) => {
      const quantity = itemIndex + 1;
      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      return {
        productId: product.id,
        quantity,
        unitPrice: decimal(unitPrice),
        totalPrice: decimal(totalPrice),
        productSnapshot: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          image: product.images[0]?.url ?? null,
          category: product.category?.name ?? null,
        },
      };
    });

    const shipping = subtotal > 300 ? 0 : 15;
    const tax = subtotal * 0.06;
    const total = subtotal + shipping + tax;

    const orderNumber = `YM${Date.now()}${index.toString().padStart(3, '0')}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: template.status,
        currency: 'USD',
        subtotal: decimal(subtotal),
        taxAmount: decimal(tax),
        shippingAmount: decimal(shipping),
        discountAmount: decimal(0),
        totalAmount: decimal(total),
        shippingAddressId: address.id,
        billingAddressId: address.id,
        notes: '系统自动生成的演示订单',
        items: {
          create: itemsPayload,
        },
        payments: {
          create: {
            paymentMethod: PaymentMethod.CREDIT_CARD,
            provider: 'stripe',
            providerTransactionId:
              template.paymentStatus === PaymentStatus.COMPLETED ? `TXN-${orderNumber}` : null,
            amount: decimal(total),
            currency: 'USD',
            status: template.paymentStatus,
          },
        },
        shipments: {
          create: {
            carrier: '顺丰速运',
            method: '标准快递',
            status: template.shipmentStatus,
            trackingNumber: `SF${Math.floor(Math.random() * 10 ** 10)}`,
            shippedAt:
              template.shipmentStatus === ShipmentStatus.SHIPPED || template.shipmentStatus === ShipmentStatus.DELIVERED
                ? new Date()
                : null,
            deliveredAt: template.shipmentStatus === ShipmentStatus.DELIVERED ? new Date() : null,
          },
        },
      },
    });

    console.log(`✅ 演示订单创建完成: ${order.orderNumber}`);
  }

  console.log('🎉 订单演示数据已创建，后台面板可以查看到订单、支付及物流记录。');
}

main()
  .catch((error) => {
    console.error('❌ 订单种子失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

