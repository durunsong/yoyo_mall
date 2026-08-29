import { SUPPORT_HREF } from '@/lib/navigation/support';

describe('support navigation', () => {
  it('keeps the support entry on the first-party support page', () => {
    expect(SUPPORT_HREF).toBe('/support');
  });
});
