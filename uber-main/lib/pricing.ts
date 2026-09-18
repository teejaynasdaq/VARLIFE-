export interface PricingConfig {
  base_fare: number;
  rate_per_km: number;
  rate_per_min: number;
  minimum_fare: number;
  surge_cap: number;
  platform_commission_pct: number;
}

export interface FareBreakdown {
  base_fare: number;
  distance_cost: number;
  time_cost: number;
  surge_multiplier: number;
  subtotal: number;
  final_price: number;
  platform_commission: number;
  driver_payout: number;
  discount_applied: number;
}

const DEFAULT_CONFIG: PricingConfig = {
  base_fare: 23,
  rate_per_km: 6.2,
  rate_per_min: 0.75,
  minimum_fare: 25,
  surge_cap: 1.3,
  platform_commission_pct: 15,
};

let cachedConfig: PricingConfig | null = null;
let cacheExpiry = 0;

export async function getPricingConfig(): Promise<PricingConfig> {
  if (cachedConfig && Date.now() < cacheExpiry) return cachedConfig;

  // Use default config directly — no circular supabase dependency
  cachedConfig = DEFAULT_CONFIG;
  cacheExpiry = Date.now() + 5 * 60 * 1000;
  return cachedConfig;
}

export async function calculateFare(params: {
  distanceKm: number;
  durationMinutes: number;
  rideTypeMultiplier?: number;
  surgeMultiplier?: number;
  studentDiscountPct?: number;
}): Promise<FareBreakdown> {
  const config = await getPricingConfig();
  const rideMultiplier = params.rideTypeMultiplier ?? 1;
  const surge = Math.min(params.surgeMultiplier ?? 1, config.surge_cap);

  const base_fare = config.base_fare;
  const distance_cost =
    Math.round(config.rate_per_km * params.distanceKm * 100) / 100;
  const time_cost =
    Math.round(config.rate_per_min * params.durationMinutes * 100) / 100;

  let subtotal =
    (base_fare + distance_cost + time_cost) * rideMultiplier * surge;
  subtotal = Math.max(subtotal, config.minimum_fare);

  let discount_applied = 0;
  if (params.studentDiscountPct && params.studentDiscountPct > 0) {
    discount_applied =
      Math.round(subtotal * (params.studentDiscountPct / 100) * 100) / 100;
    subtotal -= discount_applied;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  const platform_commission =
    Math.round(subtotal * (config.platform_commission_pct / 100) * 100) / 100;
  const driver_payout =
    Math.round((subtotal - platform_commission) * 100) / 100;

  return {
    base_fare,
    distance_cost,
    time_cost,
    surge_multiplier: surge,
    subtotal,
    final_price: subtotal,
    platform_commission,
    driver_payout,
    discount_applied,
  };
}

export const RIDE_TYPE_MULTIPLIERS: Record<string, number> = {
  lite: 1,
  go: 1.2,
  xl: 1.5,
  saver: 1,
  standard: 1.1,
  comfort: 1.25,
};
