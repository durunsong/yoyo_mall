type CartAddResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export async function addProductToServerCart(
  productId: string,
  quantity = 1,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  });
  const result = (await response.json().catch(() => null)) as CartAddResponse | null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || '添加到购物车失败');
  }

  return result.data;
}
