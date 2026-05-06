/**
 * Stripe Connect Supported Countries
 * Reference: https://stripe.com/global
 * Only these countries are supported by Stripe Connect for Express accounts
 */

export const STRIPE_SUPPORTED_COUNTRIES = [
  "US", // United States
  "GB", // United Kingdom
  "FR", // France
  "DE", // Germany
  "IT", // Italy
  "ES", // Spain
  "NL", // Netherlands
  "BE", // Belgium
  "AT", // Austria
  "CH", // Switzerland
  "SE", // Sweden
  "NO", // Norway
  "DK", // Denmark
  "FI", // Finland
  "IE", // Ireland
  "CZ", // Czech Republic
  "SK", // Slovakia
  "HU", // Hungary
  "RO", // Romania
  "BG", // Bulgaria
  "HR", // Croatia
  "SI", // Slovenia
  "LT", // Lithuania
  "LV", // Latvia
  "EE", // Estonia
  "MT", // Malta
  "CY", // Cyprus
  "GR", // Greece
  "PT", // Portugal
  "LU", // Luxembourg
  "AU", // Australia
  "JP", // Japan
  "SG", // Singapore
  "HK", // Hong Kong
  "CA", // Canada
  "MX", // Mexico
  "BR", // Brazil
  "IN", // India
  "TH", // Thailand
  "MY", // Malaysia
  "NZ", // New Zealand
  "PH", // Philippines
  "ID", // Indonesia
  "VN", // Vietnam
  "AE", // United Arab Emirates
  "SA", // Saudi Arabia
  "PK", // Pakistan
];

/**
 * Validates if a country is supported by Stripe Connect
 * @param country - Country code (e.g., "US", "GB", "FR")
 * @returns true if country is supported, false otherwise
 */
export const isValidStripeCountry = (
  country: string | null | undefined,
): boolean => {
  if (!country || typeof country !== "string") return false;
  return STRIPE_SUPPORTED_COUNTRIES.includes(country.toUpperCase());
};

/**
 * Gets the error message for unsupported country
 * @param country - Country code provided by user
 * @returns User-friendly error message
 */
export const getCountryErrorMessage = (
  country: string | null | undefined,
): string => {
  if (!country) {
    return "Country is required. Please set your country in your profile before connecting a Stripe account.";
  }

  return `Country '${country}' is not supported by Stripe Connect. Supported countries: ${STRIPE_SUPPORTED_COUNTRIES.sort().join(
    ", ",
  )}.`;
};

/**
 * Normalizes country input to uppercase 2-letter code
 * @param country - Country input (any case)
 * @returns Normalized country code or null if invalid
 */
export const normalizeCountryCode = (
  country: string | null | undefined,
): string | null => {
  if (!country || typeof country !== "string") return null;
  const normalized = country.toUpperCase().trim();
  return isValidStripeCountry(normalized) ? normalized : null;
};

/**
 * Maps full country names to codes (useful for UI)
 */
export const COUNTRY_CODE_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  AT: "Austria",
  CH: "Switzerland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  IE: "Ireland",
  CZ: "Czech Republic",
  SK: "Slovakia",
  HU: "Hungary",
  RO: "Romania",
  BG: "Bulgaria",
  HR: "Croatia",
  SI: "Slovenia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  MT: "Malta",
  CY: "Cyprus",
  GR: "Greece",
  PT: "Portugal",
  LU: "Luxembourg",
  AU: "Australia",
  JP: "Japan",
  SG: "Singapore",
  HK: "Hong Kong",
  CA: "Canada",
  MX: "Mexico",
  BR: "Brazil",
  IN: "India",
  TH: "Thailand",
  MY: "Malaysia",
  NZ: "New Zealand",
  PH: "Philippines",
  ID: "Indonesia",
  VN: "Vietnam",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  PK: "Pakistan",
};
