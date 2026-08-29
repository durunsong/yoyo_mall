import React from 'react';
import { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/components/admin/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/newsletter',
}));

import NewsletterAdminPage from '@/app/admin/newsletter/page';

describe('NewsletterAdminPage', () => {
  it('links campaign creation to the working email composer', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: { subscribers: [], stats: { total: 0, active: 0, pending: 0, unsubscribed: 0 } },
      }),
    }) as jest.Mock;
    render(React.createElement(NewsletterAdminPage));
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('tab', { name: '营销活动' }), {
        button: 0,
        ctrlKey: false,
      });
    });

    await waitFor(() => {
      const campaignAction = screen.getByRole('link', { name: /新建活动/ });
      expect(campaignAction.getAttribute('href')).toBe('/admin/email');
      expect(screen.queryByText('营销活动功能即将上线')).toBeNull();
    });
  });
});
