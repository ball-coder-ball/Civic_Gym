/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        // If we are deploying to production on Vercel and haven't set a Python backend URL yet,
        // we don't want to rewrite to localhost.
        if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BACKEND_URL) {
            return [];
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
        return [
            {
                source: "/api/:path*",
                destination: `${backendUrl}/api/:path*`, // Proxy to Backend
            },
        ];
    },
};

module.exports = nextConfig;
