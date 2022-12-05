import type { PrismaClient } from "@prisma/client";

declare namespace NodeJS {
  interface Global {
    prisma: PrismaClient;
  }
}

declare global {
  var prisma: PrismaClient;
}

export {};
