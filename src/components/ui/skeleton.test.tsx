import { render } from '@testing-library/react';
import { QuerySkeleton, Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renders a borderless, shadowless loading block', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const skeleton = container.firstElementChild;

    expect(skeleton?.className).toContain('skeleton-wave');
    expect(skeleton?.className).toContain('border-0');
    expect(skeleton?.className).toContain('shadow-none');
  });

  it('keeps query skeleton wrappers borderless when callers pass border styles', () => {
    const { container } = render(<QuerySkeleton className="border shadow-lg" />);
    const skeleton = container.firstElementChild;

    expect(skeleton?.className).toContain('border-0');
    expect(skeleton?.className).toContain('shadow-none');
    expect(skeleton?.className).not.toMatch(/(?:^| )border(?: |$)/);
  });
});
