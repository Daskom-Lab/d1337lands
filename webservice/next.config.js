/** @type {import('next').NextConfig} */
const path = require("path")
const localEnv = require("dotenv").config({ path: path.resolve(__dirname, "./.env") })

const nextConfig = {
  reactStrictMode: true,
  env: localEnv,
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
  experimental: {
    outputStandalone: true,
  }
});
