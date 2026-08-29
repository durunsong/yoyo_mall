'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCartStore } from '@/store/cart-store';
import { getCurrencySymbol, useSystemSettings } from '@/hooks/use-system-settings';

const PLACEHOLDER_IMAGE =
  'https://next-static-oss.oss-cn-shanghai.aliyuncs.com/placeholder.png';

export function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { settings } = useSystemSettings();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const syncItem = async (
    itemId: string,
    action: 'quantity' | 'remove',
    quantity?: number,
  ) => {
    const response = await fetch(`/api/cart/${itemId}`, {
      method: action === 'remove' ? 'DELETE' : 'PUT',
      headers: action === 'remove' ? undefined : { 'Content-Type': 'application/json' },
      body: action === 'remove' ? undefined : JSON.stringify({ quantity }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(result?.message || '购物车更新失败');
    }
  };

  const handleQuantity = async (itemId: string, nextQuantity: number) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || nextQuantity < 1 || pendingId) return;

    setPendingId(itemId);
    updateQuantity(itemId, nextQuantity);
    try {
      await syncItem(itemId, 'quantity', nextQuantity);
    } catch (error) {
      updateQuantity(itemId, item.quantity);
      toast.error(error instanceof Error ? error.message : '购物车更新失败');
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || pendingId) return;

    setPendingId(itemId);
    removeItem(itemId);
    try {
      await syncItem(itemId, 'remove');
      toast.success('商品已移除');
    } catch (error) {
      useCartStore.getState().addItem(item);
      toast.error(error instanceof Error ? error.message : '商品移除失败');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
            购物车
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">{itemCount} 件商品</span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">查看和管理购物车中的商品</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">购物车还是空的</h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">把喜欢的商品加入购物车，结算时会更方便。</p>
            <Button className="mt-6" onClick={closeCart} asChild>
              <Link href="/products">开始购物</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-1 overflow-y-auto px-6 py-4">
              {items.map((item) => {
                const isPending = pendingId === item.id;
                return (
                  <div key={item.id} className="flex gap-3 border-b py-4 last:border-0">
                    <Link href={`/products/${item.productId}`} onClick={closeCart} className="shrink-0">
                      <Image
                        src={item.image || PLACEHOLDER_IMAGE}
                        alt={item.name}
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] rounded-md object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.productId}`}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-medium leading-5 hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="-mr-2 -mt-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`移除 ${item.name}`}
                          disabled={isPending}
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-md border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            aria-label="减少数量"
                            disabled={isPending || item.quantity <= 1}
                            onClick={() => handleQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            aria-label="增加数量"
                            disabled={isPending}
                            onClick={() => handleQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t bg-muted/30 px-6 py-5">
              <div className="mb-4 flex items-center justify-between text-base font-semibold">
                <span>小计</span>
                <span className="tabular-nums">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">税费和配送费将在结算时根据收货地址计算。</p>
              <Button className="h-11 w-full justify-between" asChild onClick={closeCart}>
                <Link href="/checkout">
                  去结算
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" className="mt-2 w-full" onClick={closeCart}>
                继续购物
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
