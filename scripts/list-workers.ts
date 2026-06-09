import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const workers = await prisma.user.findMany({
    where: { role: "worker" }
  })
  console.log("All workers in DB:")
  workers.forEach(w => {
    console.log(`- ID: ${w.id}, Name: ${w.name}, Profession: ${w.profession}, Email: ${w.email}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
