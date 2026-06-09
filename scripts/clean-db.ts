import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function main() {
  const result = await p.user.deleteMany({
    where: { role: "worker" }
  })
  console.log(`Deleted all worker accounts. Total: ${result.count}`)
}
main().finally(() => p.$disconnect())
