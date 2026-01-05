import { PrismaClient } from "@prisma/client";

// Singleton pattern to prevent multiple Prisma client instances
// This is crucial in development to avoid exhausting database connections
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

export { prisma };
