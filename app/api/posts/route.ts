import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const currentUserId = searchParams.get("userId") || null
    const filterByUser = searchParams.get("byUser") || null

    const posts = await prisma.post.findMany({
      where: filterByUser ? { userId: filterByUser } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profession: true,
            avatar: true,
            verified: true,
            rating: true,
            location: true,
            role: true,
            bio: true,
            upiId: true,
            bankAccount: true,
            bankIfsc: true,
          },
        },
        userLikes: true,
        userSaves: true,
        postComments: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: { createdAt: "asc" }
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      user: { ...post.user, isFollowing: false },
      images: JSON.parse(post.images),
      likes: post.likes,
      comments: post.postComments.length,
      commentsList: post.postComments.map(c => ({
        id: c.id,
        userName: c.user.name,
        userAvatar: c.user.avatar || "",
        text: c.text,
        createdAt: c.createdAt.toISOString()
      })),
      description: post.description,
      tags: JSON.parse(post.tags),
      timestamp: post.createdAt.toISOString(),
      isLiked: currentUserId ? post.userLikes.some((l: any) => l.userId === currentUserId) : false,
      isSaved: currentUserId ? post.userSaves.some((s: any) => s.userId === currentUserId) : false,
      location: post.location,
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, description, images, tags, location } = await req.json()

    if (!userId || !description || !images) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        userId,
        description,
        images: JSON.stringify(images),
        tags: JSON.stringify(tags || []),
        location: location || "",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profession: true,
            avatar: true,
            verified: true,
            rating: true,
            location: true,
            upiId: true,
            bankAccount: true,
            bankIfsc: true,
            role: true,
            bio: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        id: post.id,
        user: {
          ...post.user,
          isFollowing: false,
        },
        images: JSON.parse(post.images),
        likes: 0,
        comments: 0,
        description: post.description,
        tags: JSON.parse(post.tags),
        timestamp: post.createdAt.toISOString(),
        isLiked: false,
        isSaved: false,
        location: post.location,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")

    if (!postId) {
      return NextResponse.json(
        { error: "Missing required fields: postId" },
        { status: 400 }
      )
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete post error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
