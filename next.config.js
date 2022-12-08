/** @type {import('next').NextConfig} */
const { PrismaClient } = require("@prisma/client");
require("./utils/string");

global.prisma = new PrismaClient();

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
