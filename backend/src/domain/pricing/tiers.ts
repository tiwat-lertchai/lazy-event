// Tier pricing — printing more copies of the same photo costs less per print.
// Same price table applies to both paper sizes (4x6 and polaroid_3x3).
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