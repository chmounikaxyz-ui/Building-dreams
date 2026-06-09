import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/db/auth"

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.save.deleteMany()
  await prisma.like.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
  await prisma.material.deleteMany()

  console.log("Creating seed data...")

  // 1. Create Explorer User
  await prisma.user.create({
    data: {
      email: "explorer@construction.com",
      password: await hashPassword("password123"),
      name: "Explorer User",
      role: "explorer",
      profession: "Explorer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
      bio: "Looking to hire professionals and purchase construction materials",
      location: "Mumbai, India",
      rating: 5.0,
      verified: true,
    },
  })

  // 2. Create Worker User
  await prisma.user.create({
    data: {
      email: "worker@construction.com",
      password: await hashPassword("password123"),
      name: "Worker User",
      role: "worker",
      profession: "Mason",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      bio: "Professional Mason with 10+ years of experience in residential construction.",
      location: "Mumbai, India",
      rating: 4.8,
      verified: true,
    },
  })

  // 3. Create Seller User
  await prisma.user.create({
    data: {
      email: "seller@construction.com",
      password: await hashPassword("password123"),
      name: "Seller User",
      role: "seller",
      profession: "Materials Seller",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      bio: "Dealer in high quality cement, sand, steel, and other construction materials.",
      location: "Mumbai, India",
      rating: 4.9,
      verified: true,
    },
  })

  console.log("Seed data created successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
