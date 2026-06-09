const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning all auto-generated avatars...')
  
  // Update all users with dicebear avatars to empty string
  const result = await prisma.user.updateMany({
    where: {
      avatar: {
        contains: 'dicebear'
      }
    },
    data: {
      avatar: ''
    }
  })
  
  console.log(`✅ Cleaned ${result.count} user avatars`)
  
  // Also clean any unsplash avatars
  const result2 = await prisma.user.updateMany({
    where: {
      avatar: {
        contains: 'unsplash'
      }
    },
    data: {
      avatar: ''
    }
  })
  
  console.log(`✅ Cleaned ${result2.count} unsplash avatars`)
  
  console.log('\n📊 Current users:')
  const users = await prisma.user.findMany({
    select: { name: true, email: true, avatar: true }
  })
  users.forEach(u => {
    console.log(`${u.name}: ${u.avatar ? '✓ has avatar' : '✗ no avatar'}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
