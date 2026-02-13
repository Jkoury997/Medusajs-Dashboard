import type { NextConfig } from "next";

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://backend.marcelakoury.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/medusa/:path*",
        destination: `${MEDUSA_BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
