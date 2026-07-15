/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma / bcrypt / playwright must stay external (not bundled) for server routes.
  serverExternalPackages: ["@prisma/client", "bcryptjs", "playwright", "playwright-core"],
};

export default nextConfig;
