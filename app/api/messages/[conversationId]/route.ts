import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// Allow up to 10MB request body for file/image uploads
export const maxDuration = 30

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { userId } = await req.json()
    // Mark all messages NOT sent by userId as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: "read" }
      },
      data: { status: "read" }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            profession: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { senderId, text } = await req.json()

    if (!senderId || !text) {
      return NextResponse.json(
        { error: "Missing senderId or text" },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
        status: "sent",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            profession: true,
          },
        },
      },
    })

    // Store a clean preview (not full base64) as lastMessage
    const lastMessagePreview = text.startsWith("__FILE__")
      ? `__FILE__${text.replace("__FILE__", "").split("||").slice(0, 3).join("||")}` // name||ext||size only
      : text.startsWith("__IMG__")
      ? "__IMG__photo" // just a marker, no base64
      : text

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: lastMessagePreview,
        lastMessageTime: new Date(),
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Create message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    // Delete all messages in the conversation
    await prisma.message.deleteMany({
      where: { conversationId },
    })

    // Reset lastMessage of conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: null,
        lastMessageTime: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Clear conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
