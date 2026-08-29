/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemSettings: { findUnique: jest.fn() },
  },
}));

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/settings/route';

describe('GET /api/settings', () => {
  it('returns default public settings when storage is unavailable', async () => {
    jest.mocked(prisma.systemSettings.findUnique).mockRejectedValueOnce(
      new Error('DATABASE_URL is missing'),
    );

    const response = await GET({ url: 'http://localhost/api/settings' } as NextRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        siteName: 'Yobuy',
        defaultLanguage: 'en-US',
        defaultCurrency: 'CNY',
        stripeEnabled: false,
      },
    });
  });

  it('hides unsupported payment providers even when legacy storage enabled them', async () => {
    jest.mocked(prisma.systemSettings.findUnique).mockResolvedValueOnce({
      siteName: 'Yobuy',
      siteDescription: null,
      siteUrl: null,
      contactEmail: null,
      contactPhone: null,
      defaultLanguage: 'en-US',
      defaultCurrency: 'CNY',
      stripeEnabled: false,
      alipayEnabled: true,
      wechatPayEnabled: true,
      productDetailConfig: {},
    } as never);

    const response = await GET({ url: 'http://localhost/api/settings' } as NextRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        alipayEnabled: false,
        wechatPayEnabled: false,
      },
    });
  });
});
