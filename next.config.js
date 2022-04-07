/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const withTM = require("next-transpile-modules")(["react-syntax-highlighter", "xterm-for-react"]);

module.exports = withTM({
  future: {
    webpack5: true,
  },

  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,

      fs: false,
    };

    return config;
  },

  nextConfig,
});
