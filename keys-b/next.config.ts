import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // иначе Turbopack поднимается до package-lock.json в домашней папке
  turbopack: { root: __dirname },
};

export default nextConfig;
