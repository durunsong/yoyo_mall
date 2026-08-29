/** @jest-environment node */

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/authz', () => ({
  requireAdmin: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemSettings: {
      upsert: jest.fn().mockResolvedValue({
        id: 'global',
        productDetailConfig: {},
      }),
    },
  },
}));

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PUT } from '@/app/api/admin/settings/route';

describe('PUT /api/admin/settings', () => {
  it('does not persist unsupported payment providers as enabled', async () => {
    const request = new Request('http://localhost/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        alipayEnabled: true,
        alipayAppId: 'unexpected-app-id',
        wechatPayEnabled: true,
        wechatPayMchId: 'unexpected-mch-id',
      }),
    });

    const response = await PUT(request as NextRequest);

    expect(response.status).toBe(200);
    expect(prisma.systemSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          alipayEnabled: false,
          wechatPayEnabled: false,
        }),
      }),
    );
  });
});
