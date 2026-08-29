import { filterUsableSocialLinks } from '@/lib/footer/social';

describe('filterUsableSocialLinks', () => {
  it('removes placeholder links while preserving configured destinations', () => {
    expect(
      filterUsableSocialLinks([
        { name: 'Facebook', href: '#' },
        { name: 'Instagram', href: 'https://instagram.com/yobuy' },
        { name: 'Twitter', href: '  ' },
      ]),
    ).toEqual([{ name: 'Instagram', href: 'https://instagram.com/yobuy' }]);
  });
});
