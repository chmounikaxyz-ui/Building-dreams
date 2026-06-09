const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all posts, comments, likes, and saves...')
  
  // Delete all comments
  const comments = await prisma.comment.deleteMany({})
  console.log(`✅ Deleted ${comments.count} comments`)
  
  // Delete all likes
  const likes = await prisma.like.deleteMany({})
  console.log(`✅ Deleted ${likes.count} likes`)
  
  // Delete all saves
  const saves = await prisma.save.deleteMany({})
  console.log(`✅ Deleted ${saves.count} saves`)
  
  // Delete all posts
  const posts = await prisma.post.deleteMany({})
  console.log(`✅ Deleted ${posts.count} posts`)
  
  console.log('\n✨ Database is now clean - no posts, comments, likes, or saves')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
