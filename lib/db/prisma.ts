import { PrismaClient } from "@prisma/client"
import path from "path"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (url && url.startsWith("file:")) {
    const relativePath = url.replace("file:", "")
    if (!path.isAbsolute(relativePath)) {
      // Resolve relative to the prisma directory to align with Prisma CLI
      const absolutePath = path.resolve(process.cwd(), "prisma", relativePath)
      return `file:${absolutePath}`
    }
  }
  return url
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ["query"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
