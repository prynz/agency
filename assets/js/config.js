/**
 * Central site configuration.
 * Change brand name, contact details and form endpoint here —
 * every element with [data-brand], [data-brand-short], [data-email] etc. is updated at runtime.
 */
window.SITE_CONFIG = {
  brandName: "[AGENCY NAME]",
  brandShort: "AN", // two-letter mark used in the navigation logo
  tagline: "Creator Marketing & Brand Partnerships",
  contactEmail: "hello@your-domain.com",
  location: "[CITY], [COUNTRY]",

  // Optional: URL that accepts a JSON POST (e.g. own API, Formspree, Make/Zapier webhook).
  // Leave empty to fall back to a pre-filled email (mailto) — no backend required.
  formEndpoint: "",

  social: {
    instagram: "#",
    tiktok: "#",
    linkedin: "#",
    youtube: "#",
  },
};
