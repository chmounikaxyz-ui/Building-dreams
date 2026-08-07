import { PrismaClient } from "@prisma/client"
import path from "path"
import fs from "fs"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (url && url.startsWith("file:")) {
    const relativePath = url.replace("file:", "")
    if (!path.isAbsolute(relativePath)) {
      // Resolve relative to the prisma directory to align with Prisma CLI
      const absolutePath = path.resolve(process.cwd(), "prisma", relativePath)

      // Auto-migration helper: if old database path has a database but new one doesn't, copy it
      const oldNestedPath = path.resolve(process.cwd(), "prisma", "prisma", path.basename(relativePath))
      if (fs.existsSync(oldNestedPath) && !fs.existsSync(absolutePath)) {
        try {
          fs.copyFileSync(oldNestedPath, absolutePath)
          console.log(`Successfully migrated database from ${oldNestedPath} to ${absolutePath}`)
        } catch (err) {
          console.error(`Failed to auto-migrate database file:`, err)
        }
      }

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
