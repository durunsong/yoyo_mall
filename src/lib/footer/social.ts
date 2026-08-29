export function filterUsableSocialLinks<T extends { href: string }>(links: T[]): T[] {
  return links.filter((link) => {
    const href = link.href.trim();
    return href.length > 0 && href !== '#';
  });
}
