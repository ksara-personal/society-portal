/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Rewrites barrel imports to deep per-module imports, so a page that uses a
    // handful of lucide icons doesn't pull the whole icon set through the
    // module graph.
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
};

module.exports = nextConfig;
