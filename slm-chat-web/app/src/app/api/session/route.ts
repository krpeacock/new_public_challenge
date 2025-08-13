import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await request.json()
  
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  // Set the cookie in the response
  const response = NextResponse.json({ success: true })
  response.cookies.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  })

  return response
}
