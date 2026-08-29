/** @jest-environment node */

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { role: 'ADMIN' } }),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    homeBanner: {
      update: jest.fn().mockResolvedValue({
        id: 'banner-1',
        imageUrl: '/banner.jpg',
        linkUrl: '/deals',
        altText: 'Updated banner',
      }),
    },
  },
}));

import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { PATCH } from '@/app/api/admin/home-banners/route';

describe('PATCH /api/admin/home-banners', () => {
  it('updates one banner content record', async () => {
    const request = new Request('http://localhost/api/admin/home-banners?id=banner-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageUrl: '/banner.jpg',
        linkUrl: '/deals',
        altText: 'Updated banner',
      }),
    });

    const response = await PATCH(request as NextRequest);

    expect(response.status).toBe(200);
    expect(prisma.homeBanner.update).toHaveBeenCalledWith({
      where: { id: 'banner-1' },
      data: {
        imageUrl: '/banner.jpg',
        linkUrl: '/deals',
        altText: 'Updated banner',
      },
    });
  });
});
