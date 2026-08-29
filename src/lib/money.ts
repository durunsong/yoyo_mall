export function normalizeMoney(value: number | string | null | undefined): number {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
}
