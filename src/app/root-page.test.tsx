jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/server/system-settings', () => ({
  getSystemSettings: jest.fn(),
}));

import { redirect } from 'next/navigation';
import { getSystemSettings } from '@/lib/server/system-settings';
import RootPage from '@/app/page';

describe('RootPage', () => {
  it('uses the configured default language before redirecting', async () => {
    jest.mocked(getSystemSettings).mockResolvedValue({
      defaultLanguage: 'zh-CN',
    } as Awaited<ReturnType<typeof getSystemSettings>>);

    await RootPage();

    expect(getSystemSettings).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/zh-CN');
  });
});
