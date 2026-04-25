/**
 * Building / layout configuration
 *
 * Controls the wings and flat number ranges shown in all dropdowns across the
 * app (registration, profile, issue forms, filters, admin views).
 *
 * HOW TO CONFIGURE
 * Set NEXT_PUBLIC_WINGS_CONFIG in your .env.local (or Vercel env vars) as a
 * JSON array. Each item needs:
 *
 *   name       - wing label shown in dropdowns, e.g. "A", "Block 1", "North"
 *   flatStart  - first flat/unit number in this wing (inclusive)
 *   flatEnd    - last flat/unit number in this wing (inclusive)
 *
 * Example - three wings:
 *   NEXT_PUBLIC_WINGS_CONFIG='[{"name":"North","flatStart":1,"flatEnd":20},{"name":"South","flatStart":21,"flatEnd":40}]'
 *
 * Example - single block, units 101-215:
 *   NEXT_PUBLIC_WINGS_CONFIG='[{"name":"Main","flatStart":101,"flatEnd":215}]'
 *
 * If the env var is absent or invalid JSON, the default Society Portal layout
 * is used as a fallback (Wings A-E).
 */

type WingConfig = {
  name: string;
  flatStart: number;
  flatEnd: number;
};

/** Default wings - used when NEXT_PUBLIC_WINGS_CONFIG is not set */
const DEFAULT_WINGS: WingConfig[] = [
  { name: "A", flatStart: 1,  flatEnd: 9  },
  { name: "B", flatStart: 10, flatEnd: 19 },
  { name: "C", flatStart: 20, flatEnd: 33 },
  { name: "D", flatStart: 34, flatEnd: 49 },
  { name: "E", flatStart: 50, flatEnd: 57 },
];

function parseWingsConfig(raw: string | undefined): WingConfig[] {
  if (!raw) return DEFAULT_WINGS;
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(
        (w) =>
          typeof w.name === "string" &&
          typeof w.flatStart === "number" &&
          typeof w.flatEnd === "number" &&
          w.flatEnd >= w.flatStart
      )
    ) {
      return parsed as WingConfig[];
    }
    console.warn(
      "[building config] NEXT_PUBLIC_WINGS_CONFIG is invalid - falling back to defaults. " +
      'Expected: [{"name":"A","flatStart":1,"flatEnd":9}, ...]'
    );
    return DEFAULT_WINGS;
  } catch {
    console.warn(
      "[building config] NEXT_PUBLIC_WINGS_CONFIG is not valid JSON - falling back to defaults."
    );
    return DEFAULT_WINGS;
  }
}

export const BUILDING_CONFIG = {
  wings: parseWingsConfig(process.env.NEXT_PUBLIC_WINGS_CONFIG),
};
