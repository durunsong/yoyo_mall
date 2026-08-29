'use client';

import { SessionContext, SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
  authEnabled?: boolean;
}

export function AuthProvider({ children, authEnabled = true }: AuthProviderProps) {
  if (!authEnabled) {
    return (
      <SessionContext.Provider
        value={{
          data: null,
          status: 'unauthenticated',
          update: async () => null,
        }}
      >
        {children}
      </SessionContext.Provider>
    );
  }

  return <SessionProvider>{children}</SessionProvider>;
}
