/** @jest-environment node */

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      findMany: jest.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GET as getSubscribers } from '@/app/api/admin/newsletter/subscribers/route';
import { GET as exportSubscribers } from '@/app/api/admin/newsletter/export/route';

describe('admin newsletter authorization', () => {
  beforeEach(() => {
    jest.mocked(auth).mockResolvedValue({
      user: { role: 'SUPER_ADMIN' },
    } as never);
    jest.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue([]);
  });

  it('allows SUPER_ADMIN to view subscribers', async () => {
    const response = await getSubscribers();

    expect(response.status).toBe(200);
  });

  it('allows SUPER_ADMIN to export subscribers', async () => {
    const response = await exportSubscribers();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
  });
});
