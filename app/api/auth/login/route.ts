import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { verifyPassword, signToken } from "@/lib/db/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    const token = signToken({ id: user.id, email: user.email })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profession: user.profession,
        avatar: user.avatar,
        phone: user.phone,
        upiId: user.upiId,
        bankAccount: user.bankAccount,
        bankIfsc: user.bankIfsc,
        bio: user.bio,
        location: user.location,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
