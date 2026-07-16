import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.user.deleteMany({
    where: {
      role: {
        in: ['explorer', 'seller']
      }
    }
  })
  console.log(`Deleted ${result.count} users.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
