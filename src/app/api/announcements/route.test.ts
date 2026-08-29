/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    announcement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    announcementConfig: {
      upsert: jest.fn(),
    },
  },
}));

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/announcements/route';

describe('GET /api/announcements', () => {
  it('returns an empty public feed when announcement storage is unavailable', async () => {
    jest.mocked(prisma.announcement.findMany).mockRejectedValueOnce(
      new Error('DATABASE_URL is missing'),
    );

    const response = await GET({
      url: 'http://localhost/api/announcements?active=true&includeConfig=true',
    } as NextRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: [],
      config: null,
      meta: { total: 0 },
    });
  });
});
