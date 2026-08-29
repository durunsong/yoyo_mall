jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children, session }: { children: React.ReactNode; session?: unknown }) => (
    <div data-auth-session={session === null ? 'provider' : 'enabled'}>{children}</div>
  ),
  SessionContext: {
    Provider: ({ children }: { children: React.ReactNode }) => (
      <div data-auth-session="disabled">{children}</div>
    ),
  },
}));

import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/components/providers/auth-provider';

describe('AuthProvider', () => {
  it('keeps the session context without fetching when auth is not configured', () => {
    render(
      <AuthProvider authEnabled={false}>
        <span>storefront</span>
      </AuthProvider>,
    );

    expect(screen.getByText('storefront')).toBeTruthy();
    expect(screen.getByText('storefront').parentElement?.getAttribute('data-auth-session')).toBe(
      'disabled',
    );
  });
});
