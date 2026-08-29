import { getAnnouncementContentStyle } from '@/lib/layout/announcement';

describe('getAnnouncementContentStyle', () => {
  it('keeps announcement content at the full banner height', () => {
    expect(getAnnouncementContentStyle(64)).toEqual({ minHeight: 64 });
  });
});
