/** @type {import('next').NextConfig} */
const nextConfig = {
  // Obligatoire pour Capacitor : génère /out + index.html
  output: "export",

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Obligatoire pour Next.js export
  images: {
    unoptimized: true,
  },

  experimental: {
    // Conservation du support PDFKit
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;