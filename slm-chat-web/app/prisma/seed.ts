import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Reset data for a clean demo seed
  await prisma.modAction.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.user.deleteMany()

  // Users
  const admin = await prisma.user.create({
    data: { id: 'default-admin', username: 'Admin', role: 'ADMIN' }
  })

  const user1 = await prisma.user.create({
    data: { id: 'default-user', username: 'User', role: 'USER' }
  })

  const user2 = await prisma.user.create({
    data: { id: 'second-user', username: 'User2', role: 'USER' }
  })

  const user3 = await prisma.user.create({
    data: { id: 'third-user', username: 'ConcernedResident', role: 'USER' }
  })

  // Comments
  const supportive = await prisma.comment.create({
    data: {
      content: "It's a complex issue. We need more supportive housing and mental health services alongside long-term affordability policies.",
      authorId: user1.id
    }
  })

  const inappropriate = await prisma.comment.create({
    data: {
      content: "If immigrants stopped coming here, there'd be enough housing for the rest of us.",
      authorId: user2.id
    }
  })

  const nuanced = await prisma.comment.create({
    data: {
      content: "Shelter capacity helps in emergencies, but permanent housing and case management reduce return-to-homelessness rates.",
      authorId: user3.id
    }
  })

  // Flag the inappropriate comment by User2
  await prisma.modAction.create({
    data: {
      type: 'FLAG',
      commentId: inappropriate.id,
      modId: admin.id
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
