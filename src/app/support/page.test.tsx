import { render, screen } from '@testing-library/react';
import SupportPage from '@/app/support/page';

describe('SupportPage', () => {
  it('renders the store protection and support entry point', () => {
    render(<SupportPage />);

    expect(screen.getByRole('heading', { name: '服务保障' })).toBeTruthy();
    expect(screen.getByText(/订单号或商品链接/)).toBeTruthy();
  });
});
