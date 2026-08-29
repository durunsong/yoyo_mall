import { getBannerMutation } from '@/lib/admin/home-banners';

describe('getBannerMutation', () => {
  const banner = { imageUrl: '/banner.jpg', linkUrl: '/deals', altText: 'Sale' };

  it('builds a create request without an id', () => {
    expect(getBannerMutation(null, banner)).toEqual({
      url: '/api/admin/home-banners',
      method: 'POST',
      body: banner,
    });
  });

  it('builds an update request for an existing banner', () => {
    expect(getBannerMutation('banner/1', banner)).toEqual({
      url: '/api/admin/home-banners?id=banner%2F1',
      method: 'PATCH',
      body: banner,
    });
  });
});
