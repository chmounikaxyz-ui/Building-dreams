import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message, stack: error.stack }, { status: 500 })
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
      // Only auto-create stubs for known mock user IDs.
      // Real registered users already have DB records — skip to avoid "User <cuid>" stubs.
      const mock = mockUsers[id]
      if (!mock) {
        console.warn(`User ${id} not found in DB and not a mock — skipping stub creation.`)
        return
      }
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

export async function POST(req: NextRequest) {
  try {
    const { userId, senderId, type, text, postId, conversationId } = await req.json()
    if (!userId || !type || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure target user and sender exist in the database (auto-create stubs for mock users)
    await ensureUserExists(userId)
    if (senderId) {
      await ensureUserExists(senderId)
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        senderId: senderId || null,
        type,
        text,
        postId: postId || null,
        conversationId: conversationId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error: any) {
    console.error("Create notification error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message, stack: error.stack }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, userId } = await req.json()

    if (id) {
      const notification = await prisma.notification.update({
        where: { id },
        data: { read: true }
      })
      return NextResponse.json(notification)
    } else if (userId) {
      await prisma.notification.updateMany({
        where: { userId },
        data: { read: true }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
  } catch (error: any) {
    console.error("Update notification error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message, stack: error.stack }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    const userId = req.nextUrl.searchParams.get("userId")

    if (id) {
      await prisma.notification.delete({
        where: { id }
      })
      return NextResponse.json({ success: true })
    } else if (userId) {
      await prisma.notification.deleteMany({
        where: { userId }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
  } catch (error: any) {
    console.error("Delete notification error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message, stack: error.stack }, { status: 500 })
  }
}
