/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma / bcrypt / playwright must stay external (not bundled) for server routes.
  serverExternalPackages: ["@prisma/client", "bcryptjs", "playwright", "playwright-core"],
  experimental: {
    serverActions: {
      // Template backgrounds are high-res scans of a blank A4 diploma — the bundled PhD
      // scan alone is ~6 MB. The 1 MB default rejects the upload with a 413 before the
      // action runs, which surfaces as the Upload button doing nothing.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
