/**
 * White-label branding configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * All values are driven by NEXT_PUBLIC_* environment variables so you can
 * deploy this portal for any community without touching source code.
 *
 * Copy .env.local.example to .env.local and set these variables:
 *
 *   NEXT_PUBLIC_COMMUNITY_NAME      = "Sunset Gardens"
 *   NEXT_PUBLIC_COMMUNITY_SUBTITLE  = "Apartments"
 *   NEXT_PUBLIC_LOGO_PATH           = "/logo.png"        ← file in /public
 *   NEXT_PUBLIC_APP_DESCRIPTION     = "Community portal for Sunset Gardens"
 *   NEXT_PUBLIC_UNIT_LABEL          = "Apartment"        ← Flat / Villa / Unit
 *   NEXT_PUBLIC_MEMBER_LABEL        = "Resident"         ← Owner / Member / Tenant
 *   NEXT_PUBLIC_PRIMARY_HSL         = "221.2 83.2% 53.3%"  ← brand colour (HSL)
 *
 * Drop your logo PNG/SVG into the /public folder and point NEXT_PUBLIC_LOGO_PATH
 * at it. If no logo is found, the app falls back to the Building2 icon.
 */

export const BRANDING = {
  /** Community/society name shown throughout the UI */
  communityName:
    process.env.NEXT_PUBLIC_COMMUNITY_NAME ?? "My Community",

  /** Short subtitle shown under the logo in the sidebar (e.g. "Residences") */
  communitySubtitle:
    process.env.NEXT_PUBLIC_COMMUNITY_SUBTITLE ?? "Residences",

  /**
   * Path to the logo image, relative to the /public folder.
   * Set to an empty string "" to show no logo image (icon fallback is used).
   */
  logoPath:
    process.env.NEXT_PUBLIC_LOGO_PATH ?? "",

  /** Browser tab title & meta description */
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "Community portal",

  /**
   * Label for individual units — shown in nav links, form labels, and headings.
   *   e.g. "Villa" → "My Villa Issues"
   *        "Flat"  → "My Flat Issues"
   *        "Unit"  → "My Unit Issues"
   */
  unitLabel:
    process.env.NEXT_PUBLIC_UNIT_LABEL ?? "Unit",

  /**
   * Label for community members.
   *   e.g. "Resident" | "Owner" | "Member" | "Tenant"
   */
  memberLabel:
    process.env.NEXT_PUBLIC_MEMBER_LABEL ?? "Resident",

  /**
   * Primary brand colour expressed as bare HSL values (no "hsl()" wrapper).
   * This value is injected as the --primary CSS custom property at runtime,
   * overriding the default green.
   *
   * Preset examples:
   *   Green  (default) : "142.1 76.2% 36.3%"
   *   Blue             : "221.2 83.2% 53.3%"
   *   Indigo           : "243.4 75.4% 58.6%"
   *   Orange           : "24.6 95% 53.1%"
   *   Red              : "0 84.2% 60.2%"
   *   Purple           : "270 67% 47%"
   */
  primaryHsl:
    process.env.NEXT_PUBLIC_PRIMARY_HSL ?? "142.1 76.2% 36.3%",
} as const;

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Returns "My {unitLabel} Issues" */
export const myUnitIssuesLabel = () =>
  `My ${BRANDING.unitLabel} Issues`;

/** Returns "{unitLabel} Dashboard" */
export const unitDashboardLabel = () =>
  `${BRANDING.unitLabel} Dashboard`;

/** Returns "All {unitLabel} Issues" */
export const allUnitIssuesLabel = () =>
  `All ${BRANDING.unitLabel} Issues`;

/** Returns "{memberLabel}s" (simple plural) */
export const membersLabel = () =>
  `${BRANDING.memberLabel}s`;
