import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  try {
    const { followerId, followingId } = await req.json()

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "Missing followerId or followingId" },
        { status: 400 }
      )
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      })

      return NextResponse.json({ following: false })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      })

      // Create notification for followed user
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { name: true }
      })
      await prisma.notification.create({
        data: {
          userId: followingId,
          senderId: followerId,
          type: "follow",
          text: `${follower?.name || "Someone"} started following you`
        }
      })

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
