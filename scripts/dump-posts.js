const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const posts = await prisma.post.findMany({
    include: { user: true }
  });
  console.log("ALL POSTS:");
  for (const post of posts) {
    console.log(`Post ID: ${post.id}`);
    console.log(`Description: ${post.description}`);
    console.log(`User ID: ${post.userId}`);
    console.log(`User Name: ${post.user?.name}`);
    console.log(`User Email: ${post.user?.email}`);
    console.log(`User Role: ${post.user?.role}`);
    console.log("-------------------");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
