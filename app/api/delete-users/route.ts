import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const roles = await db.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    })
    return NextResponse.json({ success: true, roles })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
