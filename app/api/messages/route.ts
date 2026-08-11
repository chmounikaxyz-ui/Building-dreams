import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userId },
          { otherUserId: userId }
        ]
      },
      orderBy: { lastMessageTime: "desc" },
    })

    const allConversations = conversations.map(c => {
      const isInitiator = c.userId === userId
      return {
        ...c,
        // Flip perspective so the caller always sees the OTHER user's id as otherUserId
        otherUserId: isInitiator ? c.otherUserId : c.userId,
        userId: isInitiator ? c.userId : c.otherUserId,
        _perspective: isInitiator ? "initiator" : "other"
      }
    })

    const otherUserIds = Array.from(new Set(allConversations.map(c => c.otherUserId)))
    
    // Fetch users
    const users = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      select: { id: true, name: true, avatar: true, profession: true, role: true }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const convIds = allConversations.map(c => c.id)

    // Unread counts
    let unreadCounts: any[] = []
    if (convIds.length > 0) {
      unreadCounts = await prisma.message.groupBy({
        by: ['conversationId'],
        where: {
          conversationId: { in: convIds },
          senderId: { not: userId },
          status: { not: "read" }
        },
        _count: { id: true }
      } as any)
    }
    const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u._count.id]))

    // Latest message (for call signaling)
    let recentMessages: any[] = []
    if (convIds.length > 0) {
      recentMessages = await prisma.message.findMany({
        where: {
          conversationId: { in: convIds },
          createdAt: { gte: new Date(Date.now() - 5 * 60000) } // last 5 mins
        },
        orderBy: { createdAt: 'desc' }
      })
    }
    
    const latestMsgMap = new Map()
    for (const m of recentMessages) {
      if (!latestMsgMap.has(m.conversationId)) {
        latestMsgMap.set(m.conversationId, m)
      }
    }

    const enriched = allConversations.map(c => {
      const otherUser = userMap.get(c.otherUserId)
      const unreadCount = unreadMap.get(c.id) || 0
      const latestMsg = latestMsgMap.get(c.id)
      
      return {
        id: c.id,
        userId: c.userId,
        otherUserId: c.otherUserId,
        otherUserName: otherUser?.name || "Unknown User",
        otherUserAvatar: otherUser?.avatar || "",
        otherUserProfession: otherUser?.profession || "User",
        lastMessage: c.lastMessage,
        lastMessageTime: c.lastMessageTime,
        unreadCount,
        latestMsgObj: latestMsg ? { text: latestMsg.text, senderId: latestMsg.senderId, createdAt: latestMsg.createdAt } : null
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
      // Only auto-create stubs for known mock user IDs (numeric or in mockUsers map).
      // Real registered users already have DB records — don't create a broken stub with their ID as their name.
      let mock = mockUsers[id]
      if (!mock) {
        console.warn(`User ${id} not found in DB and not a mock — creating fallback stub to prevent foreign key errors.`)
        mock = {
          name: `User ${id.slice(0, 4)}`,
          profession: "User",
          avatar: "https://ui-avatars.com/api/?name=User",
          role: "user"
        }
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
    const { userId, otherUserId } = await req.json()

    if (!userId || !otherUserId) {
      return NextResponse.json({ error: "Missing userId or otherUserId" }, { status: 400 })
    }

    if (userId === otherUserId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    // Ensure both users exist in DB (auto-create stubs for mock users)
    await Promise.all([
      ensureUserExists(userId),
      ensureUserExists(otherUserId),
    ])

    // Check if conversation already exists in either direction
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userId, otherUserId },
          { userId: otherUserId, otherUserId: userId },
        ]
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId, otherUserId },
      })
    }

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error("Create conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
    }

    // Delete conversation (messages will be deleted cascade)
    await prisma.conversation.delete({
      where: { id: conversationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
