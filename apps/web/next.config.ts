import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile the shared workspace core from TypeScript source.
  transpilePackages: ["@neco/core"],
  // @libsql/client's Node build loads a native binding via a dynamic
  // require() that webpack can't statically analyze (it ends up trying to
  // bundle the package's README/LICENSE files as if they were modules).
  // serverExternalPackages alone doesn't reach it here — @neco/core (which
  // imports @libsql/client) is itself in transpilePackages, so fall back to
  // a direct webpack externals entry for the server compilation pass.
  serverExternalPackages: ["@libsql/client", "libsql"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "@libsql/client", "libsql"];
    }
    return config;
  },
};

export default nextConfig;
