import { QuerySkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main
      className="mx-auto min-h-[60vh] max-w-3xl px-6 py-16"
      aria-live="polite"
    >
      <QuerySkeleton className="bg-card rounded-lg" />
    </main>
  );
}
