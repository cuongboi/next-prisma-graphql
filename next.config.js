/** @type {import('next').NextConfig} */
const { PrismaClient } = require("@prisma/client");

global.prisma = new PrismaClient();

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
