/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@attrio/api-client', '@attrio/contracts'],
};

module.exports = nextConfig;
