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

const mockUsers: Record<string, { name: string; profession: string; avatar: string; role: string }> = {
  "101": { name: "Amit Verma", profession: "Electrician", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "102": { name: "Raj Malhotra", profession: "Plumber", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "103": { name: "Meera Joshi", profession: "Architect", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "104": { name: "Vikram Nair", profession: "Civil Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "105": { name: "Sunita Rao", profession: "Interior Designer", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "106": { name: "Deepak Sharma", profession: "Mason", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "201": { name: "Ramesh Kumar", profession: "Mason", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "202": { name: "Suresh Patel", profession: "Carpenter", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", role: "worker" },
  "203": { name: "Gauresh Singh", profession: "Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", role: "worker" },
}

async function ensureUserExists(id: string) {
  try {
    const exists = await prisma.user.findUnique({ where: { id } })
    if (!exists) {
      const mock = mockUsers[id] || { name: `User ${id}`, profession: "Explorer", avatar: "", role: "explorer" }
      await prisma.user.create({
        data: {
          id,
          email: `mock_${id}@construction.com`,
          password: "mock-password-not-used",
          name: mock.name,
          role: mock.role,
          profession: mock.profession,
          avatar: mock.avatar,
        }
      })
    }
  } catch (err) {
    console.error(`Error ensuring user ${id} exists:`, err)
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

    // Ensure sender exists in DB (auto-create stubs for mock users)
    await ensureUserExists(senderId)

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

    // Create notification for recipient
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId }
    })
    if (conv) {
      const recipientId = conv.userId === senderId ? conv.otherUserId : conv.userId
      await prisma.notification.create({
        data: {
          userId: recipientId,
          senderId: senderId,
          type: "message",
          text: `New message from ${message.sender.name}: "${lastMessagePreview.substring(0, 30)}${lastMessagePreview.length > 30 ? "..." : ""}"`,
          conversationId: conversationId
        }
      })
    }

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
