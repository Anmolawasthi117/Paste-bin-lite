import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // Change type to Promise
) {
  // 1. Await the params first!
  const { id } = await params;

  const data = await redis.get(`paste:${id}`)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const paste = typeof data === 'string' ? JSON.parse(data) : data
  
  let now = Date.now()
  if (process.env.TEST_MODE === '1') {
    const testHeader = req.headers.get('x-test-now-ms')
    if (testHeader) now = parseInt(testHeader)
  }

  if (paste.expires_at && now > new Date(paste.expires_at).getTime()) {
    await redis.del(`paste:${id}`)
    return NextResponse.json({ error: 'Expired' }, { status: 404 })
  }

  if (paste.remaining_views !== null) {
    if (paste.remaining_views <= 0) {
      await redis.del(`paste:${id}`)
      return NextResponse.json({ error: 'View limit reached' }, { status: 404 })
    }
    paste.remaining_views -= 1
    
    if (paste.remaining_views === 0) {
      await redis.del(`paste:${id}`)
    } else {
      await redis.set(`paste:${id}`, JSON.stringify(paste), { keepTtl: true })
    }
  }

  return NextResponse.json({
    content: paste.content,
    remaining_views: paste.remaining_views,
    expires_at: paste.expires_at
  })
}