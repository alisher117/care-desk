import type { Config } from "../core/contracts";

// The single place to rebrand the desk: name, colour, font, logo, locales.
export const careDeskConfig: Config = {
  name: "Care Desk",
  branding: {
    primaryColor: "#2563eb",
    fontFamily: "system-ui",
    // logoUrl: "/logo.svg",  // file in /public; without it the name is shown as text
  },
  defaultLocale: "en",
  locales: ["en", "ru", "kk"],
};
