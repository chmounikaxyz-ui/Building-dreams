import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all messages...')
  await prisma.message.deleteMany()
  console.log('Deleting all conversations...')
  await prisma.conversation.deleteMany()
  console.log('Deleting all comments...')
  await prisma.comment.deleteMany()
  console.log('Deleting all saves...')
  await prisma.save.deleteMany()
  console.log('Deleting all likes...')
  await prisma.like.deleteMany()
  console.log('Deleting all posts...')
  await prisma.post.deleteMany()
  console.log('Deleting all follows...')
  await prisma.follow.deleteMany()
  console.log('Deleting all notifications...')
  await prisma.notification.deleteMany()
  console.log('Deleting all cart items...')
  await prisma.cartItem.deleteMany()
  console.log('Deleting all materials...')
  await prisma.material.deleteMany()
  console.log('Deleting all users...')
  const result = await prisma.user.deleteMany()
  console.log(`Successfully deleted all ${result.count} accounts/users and all related data.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
