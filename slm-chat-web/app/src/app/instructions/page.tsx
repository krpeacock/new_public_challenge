export const dynamic = 'force-dynamic'

export default function InstructionsPage() {
  return (
    <main className="min-h-screen p-8">
      <article className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-serif mb-4">How this demo works</h1>
        <p className="mb-6 text-gray-700">
          This demo shows a comment system with shadow-banning and an admin moderation panel.
          Regular users can post comments. Admins can flag or remove flags. If a comment is
          flagged, it is hidden from other users but still visible to its author and to the admin.
          The app can also call an LLM service to automatically flag problematic comments.
        </p>

        <p className="text-gray-700 mb-6">
          You can also test any text directly on the <a className="text-blue-600 underline" href="/moderation">Moderation Test</a> page.
        </p>

        <h2 className="text-2xl font-serif mt-8 mb-3">Roles</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><span className="font-medium">User</span>: Can post comments. Sees their own comments (even if flagged).</li>
          <li><span className="font-medium">User2</span>: A second regular user. Sees only unflagged comments from others.</li>
          <li><span className="font-medium">Admin</span>: Sees all comments (flagged and unflagged). Can flag and remove flags.</li>
        </ul>

        <h2 className="text-2xl font-serif mt-8 mb-3">Try it yourself</h2>
        <ol className="list-decimal pl-6 text-gray-700 space-y-4">
          <li>
            <span className="font-medium">Create a comment (User)</span>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Go to <code>/</code>.</li>
              <li>Use the user switcher (top-right) to select <strong>User</strong>.</li>
              <li>Type a comment and click <em>Post</em>.</li>
              <li>The comment should appear for both User and User2 while unflagged.</li>
            </ul>
          </li>
          <li>
            <span className="font-medium">Manual moderation (Admin)</span>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Go to <code>/admin</code>.</li>
              <li>Click <em>Flag Comment</em> on the target item.</li>
              <li>As <strong>User</strong> (author): you still see the content.</li>
              <li>As <strong>User2</strong>: the flagged comment is hidden (shadow-banned).</li>
            </ul>
          </li>
          <li>
            <span className="font-medium">Auto-moderation via LLM</span>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Ensure the LLM API is running and the web app has <code>SLM_API_URL</code> and <code>SLM_API_KEY</code> set.</li>
              <li>Post a clearly hateful/harassing comment from <strong>User</strong>.</li>
              <li>The backend calls the LLM. If the LLM returns a moderation failure, the app auto-flags the comment.</li>
              <li>As <strong>User2</strong>: the comment should now be hidden; as <strong>Admin</strong>: it remains visible.</li>
            </ul>
          </li>
          <li>
            <span className="font-medium">Remove a flag (Admin)</span>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Go to <code>/admin</code> and click <em>Remove Flag</em> on a flagged item.</li>
              <li>As <strong>User2</strong>: the comment becomes visible again.</li>
            </ul>
          </li>
        </ol>

        <h2 className="text-2xl font-serif mt-8 mb-3">What the tests cover</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Creating a new comment</li>
          <li>Hiding flagged comments from regular users</li>
          <li>Admin flagging</li>
          <li>Shadow-ban flow (author sees, others do not)</li>
          <li>Auto-flagging via the LLM API</li>
          <li>Removing flags to restore visibility</li>
        </ul>

        <p className="mt-8 text-gray-600">
          Tip: the user switcher sets a session cookie to emulate POVs; the server renders
          comments based on the active user (SSR) so visibility is consistent across refreshes.
        </p>
      </article>
    </main>
  )
}


