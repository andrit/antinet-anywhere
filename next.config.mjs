/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enables instrumentation.ts (register() at server startup) on Next 14. Stable/default in Next 15.
  experimental: { instrumentationHook: true },
  // Fail the build on type or lint errors rather than shipping them. Next's defaults already do
  // this; stated explicitly so nobody "fixes" a red build by turning the check off.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
