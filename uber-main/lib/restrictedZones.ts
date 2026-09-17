/**
 * Common restricted zones in South Africa where ride requests are NOT allowed.
 * These are rough bounding boxes for demonstration.
 */
export const RESTRICTED_ZONES = [
  {
    name: "OR Tambo International Airport (Pickup Restricted)",
    bounds: {
      latMin: -26.145,
      latMax: -26.13,
      lngMin: 28.225,
      lngMax: 28.245,
    },
  },
  {
    name: "Cape Town International Airport (Pickup Restricted)",
    bounds: {
      latMin: -33.985,
      latMax: -33.965,
      lngMin: 18.585,
      lngMax: 18.615,
    },
  },
  {
    name: "Private High-Risk Estate (Demo)",
    bounds: {
      latMin: -26.05,
      latMax: -26.04,
      lngMin: 28.02,
      lngMax: 28.03,
    },
  },
];

export const isInRestrictedZone = (lat: number, lng: number) => {
  return RESTRICTED_ZONES.find((zone) => {
    return (
      lat >= zone.bounds.latMin &&
      lat <= zone.bounds.latMax &&
      lng >= zone.bounds.lngMin &&
      lng <= zone.bounds.lngMax
    );
  });
};
