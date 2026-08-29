jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

import { fireEvent, render, screen } from '@testing-library/react';
import ProductSearch from '@/components/products/product-search';

describe('ProductSearch', () => {
  it('keeps clear and submit controls separate when a query is entered', () => {
    render(<ProductSearch />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '土豆' } });

    expect(screen.getByRole('button', { name: '清空搜索' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '搜索' })).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('clears the query without leaving a stale input value', () => {
    render(<ProductSearch />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '土豆' } });
    fireEvent.click(screen.getByRole('button', { name: '清空搜索' }));

    expect(input.value).toBe('');
  });
});
