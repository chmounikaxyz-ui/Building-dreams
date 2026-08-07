import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `You are Sara, an expert AI assistant for "Building Dreams" — a construction professional networking app in India. 
You help users with construction materials, cost estimates in ₹, hiring professionals, techniques, safety, and project planning.
Keep responses concise (2-4 sentences), practical, and specific to Indian construction. Be friendly and professional.`

export async function POST(req: NextRequest) {
  let message: any
  try {
    const body = await req.json()
    message = body.message
    const history = body.history

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    let responseText = ""

    if (apiKey.startsWith("sk-")) {
      // Use OpenRouter API for OpenRouter/OpenAI compatible keys
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Building Dreams",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          max_tokens: 800,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...(history || []).map((m: { isBot: boolean; text: string }) => ({
              role: m.isBot ? "assistant" : "user",
              content: m.text,
            })),
            { role: "user", content: message },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `OpenRouter responded with status ${response.status}`)
      }

      const responseData = await response.json()
      responseText = responseData.choices[0]?.message?.content?.trim() || ""
    } else {
      // Use standard Google Generative AI SDK
      const genAI = new GoogleGenerativeAI(apiKey)

      const conversationContext = (history || [])
        .slice(-6)
        .map((m: { isBot: boolean; text: string }) => `${m.isBot ? "Sara" : "User"}: ${m.text}`)
        .join("\n")

      const fullPrompt = `${SYSTEM_PROMPT}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}User: ${message}
Sara:`

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const result = await model.generateContent(fullPrompt)
      responseText = result.response.text().trim()
    }

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error("Chat API error:", error?.message || error)

    // Write the exact error to a log file for diagnostics
    try {
      const fs = require("fs")
      const path = require("path")
      const logMessage = `Date: ${new Date().toISOString()}\nError: ${error?.message || error}\nStack: ${error?.stack || ""}\n\n`
      fs.appendFileSync(path.resolve(process.cwd(), "chat-debug.log"), logMessage)
    } catch (e) {
      console.error("Failed to write chat-debug.log:", e)
    }

    // Safe fallback string construction
    const msgString = typeof message === "string" ? message : ""
    const lowerMessage = msgString.toLowerCase()
    let fallbackResponse = "I'm having trouble connecting to the AI chat service right now. Please verify your internet connection or API keys."

    if (lowerMessage.includes("cement") || lowerMessage.includes("bag")) {
      fallbackResponse += "\n\n(Fallback Info: For cement estimation, a rough rule of thumb is about 0.4 bags of cement per square foot of construction area.)"
    } else if (lowerMessage.includes("cost") || lowerMessage.includes("price") || lowerMessage.includes("estimate") || lowerMessage.includes("2bhk")) {
      fallbackResponse += "\n\n(Fallback Info: Average residential construction cost in India ranges from ₹1,200 to ₹1,800 per sq ft depending on the class of materials.)"
    } else if (lowerMessage.includes("contractor") || lowerMessage.includes("credentials") || lowerMessage.includes("check")) {
      fallbackResponse += "\n\n(Fallback Info: To check contractor credentials, verify their past project portfolio, contact at least 3 client references, and check their business registrations.)"
    } else if (lowerMessage.includes("flooring") || lowerMessage.includes("bathroom")) {
      fallbackResponse += "\n\n(Fallback Info: Anti-skid ceramic or vitrified tiles are generally considered the best flooring choice for bathrooms to prevent slipping.)"
    }

    return NextResponse.json({ response: fallbackResponse })
  }
}
