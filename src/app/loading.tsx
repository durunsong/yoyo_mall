import { LoaderCircle, ShoppingBag } from 'lucide-react';

export default function Loading() {
  return (
    <main
      className="flex min-h-[60vh] items-center justify-center px-6 py-16"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="mt-5 text-sm font-medium text-foreground">正在准备页面</p>
        <p className="mt-1 text-sm text-muted-foreground">商品和个性化内容马上就好</p>
      </div>
    </main>
  );
}
