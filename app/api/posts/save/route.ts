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

    // Check if already saved
    const existingSave = await prisma.save.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: String(postId),
        },
      },
    })

    if (existingSave) {
      // Unsave
      await prisma.save.delete({
        where: {
          userId_postId: {
            userId,
            postId: String(postId),
          },
        },
      })

      return NextResponse.json({ saved: false })
    } else {
      // Save
      await prisma.save.create({
        data: {
          userId,
          postId: String(postId),
        },
      })

      return NextResponse.json({ saved: true })
    }
  } catch (error) {
    console.error("Save post error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
