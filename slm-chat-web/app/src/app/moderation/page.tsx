'use client'

import { useState } from 'react'

export default function ModerationTestPage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<null | { flag: boolean, status?: number, reason?: string, category?: string, tookMs?: number }>(null)
  const [loading, setLoading] = useState(false)
  const examples = [
    'Immigrants are vermin and should be kicked out.',
    'Immigrants are bad and should be kicked out.',
    'We need more supportive housing and services.'
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const started = performance.now()
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input })
      })
      const data = await res.json()
      setResult({ ...data, tookMs: Math.round(performance.now() - started) })
    } catch {
      setResult({ flag: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <article className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-serif mb-4">Moderation Test</h1>
        <p className="text-gray-700 mb-6">Enter any text to see how the AI moderator classifies it.</p>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>Try:</span>
          {examples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInput(ex)}
              className="px-2 py-1 rounded border hover:bg-gray-50"
            >
              Example {i+1}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Type something to moderate..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || input.trim().length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </form>

        {result && (
          <div className="rounded-md border p-4">
            <div className="mb-3 flex items-center gap-3">
              <div>
                <span className={`px-2 py-1 rounded text-sm ${result.flag ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  Decision: {result.flag ? 'Flagged' : 'Okay'}
                </span>
              </div>
              {typeof result.tookMs === 'number' && (
                <span className="text-xs text-gray-500">{result.tookMs} ms</span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>{result.status ?? (result.flag ? 406 : 200)}</dd>
              </div>
              {result.category && (
                <div>
                  <dt className="text-gray-500">Category</dt>
                  <dd>{result.category}</dd>
                </div>
              )}
              {result.reason && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Reason</dt>
                  <dd className="text-gray-800">{result.reason}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </article>
    </main>
  )
}


