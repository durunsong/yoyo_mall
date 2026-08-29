import { addProductToServerCart } from '@/lib/cart/client';

function response(body: unknown, ok: boolean) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('addProductToServerCart', () => {
  it('posts a product to the server and returns the cart item', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      response({ success: true, data: { id: 'cart-1' } }, true),
    );

    await expect(addProductToServerCart('product-1', 2, fetcher)).resolves.toEqual({ id: 'cart-1' });
    expect(fetcher).toHaveBeenCalledWith('/api/cart', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ productId: 'product-1', quantity: 2 }),
    }));
  });

  it('surfaces the server error for an unsuccessful response', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      response({ success: false, message: '库存不足' }, false),
    );

    await expect(addProductToServerCart('product-1', 1, fetcher)).rejects.toThrow('库存不足');
  });
});
