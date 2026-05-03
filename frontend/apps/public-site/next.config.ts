import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Compile workspace TS sources directly so we don't need a build step in shared packages.
  transpilePackages: ["@ajs/ui", "@ajs/i18n", "@ajs/api-client"],
  experimental: {
    typedRoutes: true,
  },
};

export default config;
