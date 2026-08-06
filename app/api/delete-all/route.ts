import { NextResponse } from "next/server"
import { prisma as db } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Delete in correct order of relations
    const deletedLikes = await db.like.deleteMany()
    const deletedSaves = await db.save.deleteMany()
    const deletedComments = await db.comment.deleteMany()
    const deletedPosts = await db.post.deleteMany()
    const deletedFollows = await db.follow.deleteMany()
    const deletedMessages = await db.message.deleteMany()
    const deletedConversations = await db.conversation.deleteMany()
    const deletedNotifications = await db.notification.deleteMany()
    const deletedCartItems = await db.cartItem.deleteMany()
    const deletedMaterials = await db.material.deleteMany()
    const deletedUsers = await db.user.deleteMany()

    return NextResponse.json({
      success: true,
      message: "Successfully cleared all accounts, materials, and related database records.",
      details: {
        users: deletedUsers.count,
        materials: deletedMaterials.count,
        posts: deletedPosts.count,
        likes: deletedLikes.count,
        saves: deletedSaves.count,
        comments: deletedComments.count,
        follows: deletedFollows.count,
        messages: deletedMessages.count,
        conversations: deletedConversations.count,
        notifications: deletedNotifications.count,
        cartItems: deletedCartItems.count,
      }
    })
  } catch (error) {
    console.error("Failed to clear database:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
