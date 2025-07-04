/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: 'metawars.s3.eu-west-2.amazonaws.com',
            port: '',
            pathname: '/**'
        }]
    },
};

module.exports = nextConfig;
