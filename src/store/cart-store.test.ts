import { useCartStore } from './cart-store';

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().closeCart();
  });

  it('merges matching products and derives item count and subtotal', () => {
    const store = useCartStore.getState();

    store.addItem({
      productId: 'product-1',
      name: '产品一',
      price: 12.5,
      image: '/product.png',
      quantity: 2,
    });
    store.addItem({
      productId: 'product-1',
      name: '产品一',
      price: 12.5,
      image: '/product.png',
      quantity: 1,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(state.items.reduce((total, item) => total + item.quantity, 0)).toBe(3);
    expect(state.items.reduce((total, item) => total + item.price * item.quantity, 0)).toBe(37.5);
  });

  it('opens and closes the cart drawer', () => {
    useCartStore.getState().openCart();
    expect(useCartStore.getState().isOpen).toBe(true);

    useCartStore.getState().closeCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
