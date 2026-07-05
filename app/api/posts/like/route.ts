import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  try {
    const { postId, userId } = await req.json()

    if (!postId || !userId) {
      return NextResponse.json(
        { error: "Missing postId or userId" },
        { status: 400 }
      )
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: String(postId),
        },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId: String(postId),
          },
        },
      })

      // Decrease post likes count
      await prisma.post.update({
        where: { id: String(postId) },
        data: { likes: { decrement: 1 } },
      })

      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          postId: String(postId),
        },
      })

      // Increase post likes count
      await prisma.post.update({
        where: { id: String(postId) },
        data: { likes: { increment: 1 } },
      })

      // Create notification for post owner
      const post = await prisma.post.findUnique({
        where: { id: String(postId) },
        select: { userId: true }
      })
      if (post && post.userId !== userId) {
        const likingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        })
        await prisma.notification.create({
          data: {
            userId: post.userId,
            senderId: userId,
            type: "like",
            text: `${likingUser?.name || "Someone"} liked your post`,
            postId: String(postId)
          }
        })
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Like post error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
