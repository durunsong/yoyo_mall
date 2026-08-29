/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    footerSection: { findMany: jest.fn() },
    footerContact: { findMany: jest.fn() },
    footerSocial: { findMany: jest.fn() },
  },
}));

import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { GET } from '@/app/api/footer-config/route';

describe('GET /api/footer-config', () => {
  it('returns empty public configuration when storage is unavailable', async () => {
    jest.mocked(prisma.footerSection.findMany).mockRejectedValueOnce(
      new Error('DATABASE_URL is missing'),
    );

    const response = await GET({ url: 'http://localhost/api/footer-config' } as NextRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sections: [],
      contacts: [],
      socials: [],
    });
  });
});
