import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Fetch conversations where the user is either initiator OR the other party
    const [asInitiator, asOther] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { lastMessageTime: "desc" },
      }),
      prisma.conversation.findMany({
        where: { otherUserId: userId },
        orderBy: { lastMessageTime: "desc" },
      }),
    ])

    // Merge and deduplicate, flipping perspective for "asOther" so caller always sees otherUserId as the other person
    const allConversations = [
      ...asInitiator.map(c => ({ ...c, _perspective: "initiator" })),
      ...asOther.map(c => ({
        ...c,
        // Flip: from seller's perspective, the "other" user is the initiator
        otherUserId: c.userId,
        userId: c.otherUserId,
        _perspective: "other",
      })),
    ]

    // Sort by lastMessageTime desc
    allConversations.sort((a, b) => {
      if (!a.lastMessageTime) return 1
      if (!b.lastMessageTime) return -1
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    })

    return NextResponse.json(allConversations)
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
      const mock = mockUsers[id]
      if (!mock) {
        // Not a known mock ID; this is a real user who should already be in the DB.
        // Skip stub creation to avoid creating "User <cuid>" entries.
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
