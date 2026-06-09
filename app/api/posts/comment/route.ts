import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  try {
    const { postId, userId, text } = await req.json()

    if (!postId || !userId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        text,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          }
        }
      }
    })

    // Increment comment count on the post
    await prisma.post.update({
      where: { id: postId },
      data: {
        comments: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      id: comment.id,
      userName: comment.user.name,
      userAvatar: comment.user.avatar || "",
      text: comment.text,
      createdAt: comment.createdAt.toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { commentId, userId } = await req.json()

    if (!commentId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify comment ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    // Decrement comment count on the post
    await prisma.post.update({
      where: { id: comment.postId },
      data: {
        comments: {
          decrement: 1
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
