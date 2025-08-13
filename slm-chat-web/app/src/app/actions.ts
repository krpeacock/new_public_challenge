'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { moderateCommentWithSLM } from './lib/moderation'

export async function getVisibleComments(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { comments: true }
  })

  // Get all comments and their flags
  const comments = await prisma.comment.findMany({
    include: {
      author: true,
      flags: {
        where: {
          type: 'FLAG'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filter comments based on user role and flags
  return comments.filter(comment => {
    // If user is admin, show all comments
    if (user?.role === 'ADMIN') return true

    // If flagged, only author can see it
    if (comment.flags.length > 0) return comment.authorId === userId

    // Allow author to see their unflagged comment
    if (comment.authorId === userId) return true

    // Otherwise, show the comment
    return true
  }).map(comment => ({
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId,
    author: comment.author.username,
    createdAt: comment.createdAt.toISOString(),
    isHidden: comment.flags.length > 0
  }))
}

export async function addComment(userId: string, content: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const created = await prisma.comment.create({
    data: {
      content,
      authorId: userId
    }
  })

  // Call SLM for auto-moderation. If flagged, shadowban (create FLAG modAction).
  try {
    const decision = await moderateCommentWithSLM(content)
    if (decision.flag) {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      if (admin) {
        await prisma.modAction.create({
          data: {
            type: 'FLAG',
            commentId: created.id,
            modId: admin.id,
          }
        })
      }
    }
  } catch {
    // Fail open: if moderation fails, do nothing.
  }
  revalidatePath('/')
}

export async function flagComment(commentId: string, modId: string) {
  await prisma.modAction.create({
    data: {
      type: 'FLAG',
      commentId,
      modId
    }
  })
  revalidatePath('/')
}

export async function unflagComment(commentId: string, modId: string) {
  await prisma.modAction.deleteMany({
    where: {
      commentId,
      type: 'FLAG'
    }
  })
  revalidatePath('/')
}
