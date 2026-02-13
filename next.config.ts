import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  serverExternalPackages: ["pdf-parse", "yt-search"],
  // Replit handles host verification, but we can explicitly allow everything in dev
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Ensure the app works correctly behind Replit's proxy

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
