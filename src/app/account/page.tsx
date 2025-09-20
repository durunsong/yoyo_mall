'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ProfileManagement } from '@/components/profile/profile-management';
import { useStaticTranslations } from '@/hooks/use-i18n';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useStaticTranslations('common');

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/'); // Redirect to home if not authenticated
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">{t('loading') || '加载中...'}</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto py-8">
      <ProfileManagement />
    </div>
  );
}