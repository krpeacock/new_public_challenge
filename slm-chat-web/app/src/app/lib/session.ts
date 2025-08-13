import { cookies } from 'next/headers'

export async function getCurrentUser() {
  // In Next 15, `cookies()` is async in RSC and must be awaited.
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  return userId || 'default-user'
}
