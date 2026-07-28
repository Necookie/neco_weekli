import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile the shared workspace core from TypeScript source.
  transpilePackages: ["@neco/core"],
};

export default nextConfig;
