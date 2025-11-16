/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['typeorm', 'sqlite3', 'better-sqlite3'],
  turbopack: {},
};

export default nextConfig;
