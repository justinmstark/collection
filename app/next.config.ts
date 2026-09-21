import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "minio" },
      // k8s: replace YOUR_DOMAIN with your actual MinIO ingress hostname
      { protocol: "https", hostname: "minio.YOUR_DOMAIN" },
    ],
  },
};

export default nextConfig;
