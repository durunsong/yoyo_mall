'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Storefront route error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">页面暂时无法加载</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          网络或服务暂时不可用，已保留你的操作。请重试，或者稍后再回来。
        </p>
        <Button type="button" className="mt-6 gap-2" onClick={() => reset()}>
          <RefreshCw className="h-4 w-4" />
          重试
        </Button>
      </div>
    </main>
  );
}
