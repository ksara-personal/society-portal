/**
 * Building configuration — edit this file to change wings and flat ranges.
 * No code changes needed elsewhere; all dropdowns derive from this config.
 *
 * flatStart and flatEnd are inclusive.
 */
export const BUILDING_CONFIG = {
  wings: [
    { name: "A", flatStart: 1,  flatEnd: 9  },
    { name: "B", flatStart: 10, flatEnd: 19 },
    { name: "C", flatStart: 20, flatEnd: 33 },
    { name: "D", flatStart: 34, flatEnd: 49 },
    { name: "E", flatStart: 50, flatEnd: 57 },
  ],
} as const;
