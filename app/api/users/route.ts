import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name")

    const users = await prisma.user.findMany({
      where: name ? { name } : undefined,
      select: {
        id: true,
        name: true,
        profession: true,
        avatar: true,
        bio: true,
        verified: true,
        rating: true,
        location: true,
        lat: true,
        lon: true,
        role: true,
        upiId: true,
        bankAccount: true,
        bankIfsc: true,
        email: true,
      },
      take: 20,
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, email, lat, lon, location, avatar, profession, phone, upiId, bankAccount, bankIfsc, name, bio, rating } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email !== undefined && { email }),
        ...(lat !== undefined && { lat }),
        ...(lon !== undefined && { lon }),
        ...(location !== undefined && { location }),
        ...(avatar !== undefined && { avatar }),
        ...(profession !== undefined && { profession }),
        ...(phone !== undefined && { phone }),
        ...(upiId !== undefined && { upiId }),
        ...(bankAccount !== undefined && { bankAccount }),
        ...(bankIfsc !== undefined && { bankIfsc }),
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(rating !== undefined && { rating }),
      },
      select: {
        id: true,
        email: true,
        lat: true,
        lon: true,
        location: true,
        avatar: true,
        profession: true,
        phone: true,
        upiId: true,
        bankAccount: true,
        bankIfsc: true,
        name: true,
        bio: true,
        rating: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update user location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
