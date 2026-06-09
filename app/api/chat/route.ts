import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `You are Sara, an expert AI assistant for "Building Dreams" — a construction professional networking app in India. 
You help users with construction materials, cost estimates in ₹, hiring professionals, techniques, safety, and project planning.
Keep responses concise (2-4 sentences), practical, and specific to Indian construction. Be friendly and professional.`

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    const conversationContext = (history || [])
      .slice(-6)
      .map((m: { isBot: boolean; text: string }) => `${m.isBot ? "Sara" : "User"}: ${m.text}`)
      .join("\n")

    const fullPrompt = `${SYSTEM_PROMPT}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}User: ${message}
Sara:`

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent(fullPrompt)
    const responseText = result.response.text().trim()

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error("Chat API error:", error?.message || error)
    return NextResponse.json(
      { error: "Failed to get response. Please try again." },
      { status: 500 }
    )
  }
}
