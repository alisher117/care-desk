import type { NextConfig } from "next";
import { careDeskConfig } from "./src/care-desk/config/config";
import { DASHBOARD_PATH } from "./src/care-desk/web/routes";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: `/${careDeskConfig.defaultLocale}${DASHBOARD_PATH}`,
        permanent: false,
      },
      {
        source: `/:locale(${careDeskConfig.locales.join("|")})`,
        destination: `/:locale${DASHBOARD_PATH}`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
