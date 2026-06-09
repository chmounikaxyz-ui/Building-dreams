import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        avatar: true, 
        profession: true, 
        role: true, 
        upiId: true, 
        bankAccount: true, 
        bankIfsc: true, 
        email: true,
        bio: true,
        rating: true,
        verified: true,
        following: {
          select: {
            following: {
              select: {
                id: true,
                name: true,
                profession: true,
                avatar: true
              }
            }
          }
        },
        followers: {
          select: {
            follower: {
              select: {
                id: true,
                name: true,
                profession: true,
                avatar: true
              }
            }
          }
        }
      }
    })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
