import { getVisibleComments, addComment, flagComment, unflagComment } from '../actions'
import { prisma } from '@/lib/prisma'
import CommentSection from '../components/CommentSection'

// Admin page always renders as admin POV
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const adminId = admin?.id as string
  const comments = await getVisibleComments(adminId)

  async function addCommentAction(formData: FormData) {
    'use server'
    const content = (formData.get('content') as string) || ''
    if (!content.trim()) return
    await addComment(adminId, content)
  }

  async function flagCommentAction(formData: FormData) {
    'use server'
    const commentId = (formData.get('commentId') as string) || ''
    if (!commentId) return
    await flagComment(commentId, adminId)
  }

  async function unflagCommentAction(formData: FormData) {
    'use server'
    const commentId = (formData.get('commentId') as string) || ''
    if (!commentId) return
    await unflagComment(commentId, adminId)
  }

  return (
    <main className="min-h-screen p-8">
      <article className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-serif mb-4">Admin: Comments Moderation</h1>
        <section className="mt-12">
          <h2 className="text-2xl font-serif mb-6">Comments (all)</h2>
          <CommentSection
            initialComments={comments}
            currentUser={admin}
            onAddCommentAction={addCommentAction}
            onFlagCommentAction={flagCommentAction}
            onUnflagCommentAction={unflagCommentAction}
          />
        </section>
      </article>
    </main>
  )
}


