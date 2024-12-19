const createNextPluginPreval = require("next-plugin-preval/config");
const withNextPluginPreval = createNextPluginPreval();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

module.exports = withNextPluginPreval(nextConfig);

module.exports = {
  images: {
    domains: ["images.squarespace-cdn.com"], // Add the hostname here
  },
};

