import { NextResponse } from 'next/server'
import { moderateCommentWithSLM } from '../../lib/moderation'

export async function POST(request: Request) {
  try {
    const { content } = await request.json() as { content?: string }
    const decision = await moderateCommentWithSLM(content || '')
    return NextResponse.json(decision)
  } catch {
    return NextResponse.json({ flag: false }, { status: 200 })
  }
}


