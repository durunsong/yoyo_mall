jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemSettings: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { defaultSystemSettings } from '@/lib/settings/system-settings';
import { getSystemSettings } from '@/lib/server/system-settings';

describe('getSystemSettings', () => {
  it('returns defaults when the settings store is unavailable', async () => {
    jest.mocked(prisma.systemSettings.findUnique).mockRejectedValueOnce(
      new Error('DATABASE_URL is missing'),
    );

    await expect(getSystemSettings()).resolves.toEqual(defaultSystemSettings);
  });

  it('keeps unsupported payment providers disabled for legacy records', async () => {
    jest.mocked(prisma.systemSettings.findUnique).mockResolvedValueOnce({
      alipayEnabled: true,
      wechatPayEnabled: true,
      stripeEnabled: false,
      productDetailConfig: {},
    } as never);

    await expect(getSystemSettings()).resolves.toMatchObject({
      alipayEnabled: false,
      wechatPayEnabled: false,
    });
  });
});
