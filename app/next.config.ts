import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit"],
  // Dev only: let other devices on the LAN (e.g. a phone) load the dev server.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean),
  // Optional: serve MinIO through the app at /minio so images load from any device
  // that can reach the app (set MINIO_PROXY_TARGET and NEXT_PUBLIC_MINIO_PUBLIC_URL=/minio).
  async rewrites() {
    const target = process.env.MINIO_PROXY_TARGET;
    return target ? [{ source: "/minio/:path*", destination: `${target}/:path*` }] : [];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "minio" },
      // k8s: replace YOUR_DOMAIN with your actual MinIO ingress hostname
      { protocol: "https", hostname: "minio.collection.justinstark.info" },
    ],
  },
};

export default nextConfig;
