import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { hashPassword, signToken } from "@/lib/db/auth"

const ROLE_DEFAULTS: Record<string, { profession: string; avatar: string }> = {
  worker:   { profession: "Construction Worker", avatar: "" },
  seller:   { profession: "Materials Seller",    avatar: "" },
  explorer: { profession: "Explorer",            avatar: "" },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role = "explorer", profession, phone, businessName, skills, experience, expectedRates, upiId, bankAccount, bankIfsc, location, lat, lon, workerType, crewSize, groupName } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["explorer", "worker", "seller"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    // Build profession string based on role
    let resolvedProfession = profession || ROLE_DEFAULTS[role].profession
    if (role === "worker" && skills?.length) {
      resolvedProfession = skills[0] // use first skill as profession label
    }
    if (role === "seller") {
      // Only append business name if it exists and is different from user name
      if (businessName && businessName.toLowerCase() !== name.toLowerCase()) {
        resolvedProfession = `Seller · ${businessName}`
      } else {
        resolvedProfession = "Seller"
      }
    }

    // No auto-generated avatar - user adds their own
    const avatar = ""

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        profession: resolvedProfession,
        avatar,
        phone,
        upiId,
        bankAccount,
        bankIfsc,
        location,
        lat: lat ? parseFloat(lat) : undefined,
        lon: lon ? parseFloat(lon) : undefined,
        bio: (role === "worker" || role === "seller")
          ? JSON.stringify({
              bio: role === "worker"
                ? (workerType === "crew"
                    ? `Group/Crew leader. ${experience || ""} experience.`
                    : `${experience || ""} experience in ${skills?.join(", ") || "construction"}.`.trim())
                : `Selling construction materials${businessName ? ` · ${businessName}` : ""}.`,
              experience: experience || "",
              expectedRates: expectedRates || "",
              storeName: role === "seller" ? businessName : undefined,
              workerType: role === "worker" ? workerType : undefined,
              crewSize: (role === "worker" && workerType === "crew") ? crewSize : undefined,
              groupName: (role === "worker" && workerType === "crew") ? groupName : undefined,
            })
          : "",
      },
    })

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
        lat: user.lat,
        lon: user.lon,
      },
      token,
    }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
