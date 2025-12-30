import { redis } from '@/lib/redis'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { content, ttl_seconds, max_views } = await req.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const id = nanoid(10)
    const expiresAt = ttl_seconds ? Date.now() + ttl_seconds * 1000 : null
    
    const pasteData = {
      content,
      remaining_views: max_views ?? null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    }

    // Set with a buffer TTL in Redis (e.g., 7 days) so it doesn't vanish 
    // from DB before our custom logic handles it
    await redis.set(`paste:${id}`, JSON.stringify(pasteData), { ex: 604800 })

    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'

    return NextResponse.json({
      id,
      url: `${protocol}://${host}/p/${id}`
    }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
}