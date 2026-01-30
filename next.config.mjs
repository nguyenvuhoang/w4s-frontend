// Handle SSL certificate issues in development
if (process.env.NODE_ENV === 'development') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
        locale: false
      }
    ]
  },
  rewrites: async () => {
    return [
      // Handle Chrome DevTools well-known requests
      {
        source: '/.well-known/appspecific/:path*',
        destination: '/api/well-known/:path*'
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.vietqr.io",
      },
      {
        protocol: "https",
        hostname: "vietqr.net",
      },
      {
        protocol: "https",
        hostname: "1767-14-241-240-247.ngrok-free.app",
      },
      {
        protocol: "https",
        hostname: "chart.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "emicms.jits.com.vn",
      }
    ],

    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [50, 75, 100],
    dangerouslyAllowLocalIP: true,
  },
  // TODO: below line is added to resolve twice event dispatch in the calendar reducer
  reactStrictMode: true,
  // cacheComponents: true,
  // reactCompiler: true,
}

export default nextConfig
