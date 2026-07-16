import { NextResponse } from "next/server"
import { prisma as db } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const users = await db.user.findMany({})
    return NextResponse.json({ success: true, count: users.length, users })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
