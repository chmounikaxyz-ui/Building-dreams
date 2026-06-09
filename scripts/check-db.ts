import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function main() {
  const users = await p.user.findMany({ select: { id: true, name: true, role: true } })
  const convs = await p.conversation.findMany()
  const msgs = await p.message.findMany({ select: { id: true, conversationId: true, senderId: true, text: true, status: true } })
  console.log("USERS:", JSON.stringify(users, null, 2))
  console.log("CONVERSATIONS:", JSON.stringify(convs, null, 2))
  console.log("MESSAGES:", JSON.stringify(msgs, null, 2))
}
main().finally(() => p.$disconnect())
