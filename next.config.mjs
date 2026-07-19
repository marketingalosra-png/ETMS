/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "*.mux.com" },
      { protocol: "https", hostname: "*.cloudflarestream.com" },
    ],
  },
  // Increase upload size limit for video files
  experimental: {
    serverActions: {
      bodySizeLimit: "256mb",
    },
  },
};

export default nextConfig;
