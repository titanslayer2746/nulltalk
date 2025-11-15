import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure Prisma Client is included in the build
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
