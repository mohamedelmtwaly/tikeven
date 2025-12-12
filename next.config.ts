/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },

      
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },

     
      {
        protocol: "https",
        hostname: "pexels.com",
        pathname: "/**",
      },

      
      {
        protocol: "https",
        hostname: "online.edhec.edu",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "uctech2024.ucdavis.edu",
        pathname: "/**",
      },

     
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },

      
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      // QR code generator
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
