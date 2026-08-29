import React from 'react';
import { renderToString } from 'react-dom/server.node';

const push = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated', update: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/hooks/use-i18n', () => ({
  useStaticTranslations: () => ({
    t: (key: string) => key,
    locale: 'en-US',
  }),
}));

import AccountSettingsPage, { PASSWORD_CHANGE_ENDPOINT } from '@/app/account/settings/page';

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('does not navigate during server rendering when unauthenticated', () => {
    renderToString(React.createElement(AccountSettingsPage));

    expect(push).not.toHaveBeenCalled();
  });

  it('uses the existing change-password endpoint', () => {
    expect(PASSWORD_CHANGE_ENDPOINT).toBe('/api/user/change-password');
  });
});
