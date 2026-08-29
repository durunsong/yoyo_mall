export interface BannerMutationPayload {
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

export function getBannerMutation(
  id: string | null,
  body: BannerMutationPayload,
) {
  return {
    url: id
      ? `/api/admin/home-banners?id=${encodeURIComponent(id)}`
      : '/api/admin/home-banners',
    method: id ? 'PATCH' : 'POST',
    body,
  } as const;
}
