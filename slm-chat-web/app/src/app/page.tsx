import { getVisibleComments, addComment, flagComment } from './actions'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './lib/session'
import CommentSection from './components/CommentSection'
import UserSwitcher from './components/UserSwitcher'

// Mark page as dynamic
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Get current user from session
  const sessionUserId = await getCurrentUser();
  
  // Fetch data for the current user
  const [comments, currentUser] = await Promise.all([
    getVisibleComments(sessionUserId),
    prisma.user.findUnique({ where: { id: sessionUserId } })
  ]);

  async function addCommentAction(formData: FormData) {
    'use server'
    const content = (formData.get('content') as string) || ''
    if (content.trim().length === 0) return
    await addComment(sessionUserId, content)
  }

  async function flagCommentAction(formData: FormData) {
    'use server'
    const commentId = (formData.get('commentId') as string) || ''
    if (!commentId) return
    await flagComment(commentId, sessionUserId)
  }

  return (
    <main className="min-h-screen p-8">
      <UserSwitcher currentUser={currentUser} />
      <article className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-serif mb-4">SF Chronicle: Housing Crisis</h1>
        <div className="prose max-w-none mb-8">
          <p>
            Homelessness in San Francisco is a complex issue involving housing affordability, 
            mental health services, and policy decisions. Recent data shows the city&apos;s homeless 
            population has grown by 12% since last year, sparking renewed debate about potential 
            solutions. What are your thoughts on addressing this challenging situation?
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-serif mb-6">Comments</h2>
          <CommentSection
            initialComments={comments}
            currentUser={currentUser}
            onAddCommentAction={addCommentAction}
            onFlagCommentAction={flagCommentAction}
          />
        </section>
      </article>
    </main>
  )
}
