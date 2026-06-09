const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== USERS ===')
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  })
  users.forEach(u => console.log(`${u.name} (${u.role}) - ID: ${u.id} - Email: ${u.email}`))

  console.log('\n=== CONVERSATIONS ===')
  const convs = await prisma.conversation.findMany()
  for (const c of convs) {
    const user = await prisma.user.findUnique({ where: { id: c.userId }, select: { name: true } })
    const otherUser = await prisma.user.findUnique({ where: { id: c.otherUserId }, select: { name: true } })
    console.log(`Conv ${c.id}: ${user?.name || '?'} ↔ ${otherUser?.name || '?'}`)
    console.log(`  userId: ${c.userId}, otherUserId: ${c.otherUserId}`)
  }

  console.log('\n=== MESSAGES ===')
  const msgs = await prisma.message.findMany({
    include: {
      sender: { select: { name: true } }
    }
  })
  msgs.forEach(m => console.log(`${m.sender.name}: ${m.text.substring(0, 30)}...`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
