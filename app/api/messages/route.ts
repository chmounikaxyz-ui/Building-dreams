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

export async function POST(req: NextRequest) {
  try {
    const { userId, otherUserId } = await req.json()

    if (!userId || !otherUserId) {
      return NextResponse.json({ error: "Missing userId or otherUserId" }, { status: 400 })
    }

    if (userId === otherUserId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    // Verify both users exist in DB
    const [userExists, otherExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } }),
    ])

    if (!userExists) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (!otherExists) return NextResponse.json({ error: "Seller not found in database. They may need to re-save their product." }, { status: 404 })

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
