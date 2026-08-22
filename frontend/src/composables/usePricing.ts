// Tier pricing — printing more copies of the same photo costs less per print.
// Must match the backend's domain/pricing/tiers.ts exactly, backend is the source of truth for price.
export const PRICE_TIERS: Record<number, number> = {
  1: 25,
  3: 66,
  6: 120,
  12: 216,
};

export const ALLOWED_QUANTITIES = Object.keys(PRICE_TIERS).map(Number);

export function getPriceForQuantity(quantity: number): number | null {
  return PRICE_TIERS[quantity] ?? null;
}
