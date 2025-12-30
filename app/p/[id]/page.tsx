import { redis } from '@/lib/redis'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

export default async function ViewPaste(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headerList = await headers();

  // 1. Get data from Redis directly
  const data = await redis.get(`paste:${id}`)
  if (!data) return notFound()

  const paste = typeof data === 'string' ? JSON.parse(data) : data

  // 2. Deterministic Time Logic
  let now = Date.now()
  if (process.env.TEST_MODE === '1') {
    const testHeader = headerList.get('x-test-now-ms')
    if (testHeader) now = parseInt(testHeader)
  }

  // 3. Check Expiry
  if (paste.expires_at && now > new Date(paste.expires_at).getTime()) {
    await redis.del(`paste:${id}`)
    return notFound()
  }

  // 4. Check & Update View Limits
  if (paste.remaining_views !== null) {
    if (paste.remaining_views <= 0) {
      await redis.del(`paste:${id}`)
      return notFound()
    }
    
    paste.remaining_views -= 1
    
    if (paste.remaining_views === 0) {
      await redis.del(`paste:${id}`)
    } else {
      await redis.set(`paste:${id}`, JSON.stringify(paste), { keepTtl: true })
    }
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-700">View Paste</h1>
        <a href="/" className="text-sm text-blue-600 hover:underline">← Create New</a>
      </div>
      
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        {/* Render text safely (standard React curly braces prevent script execution) */}
        <pre className="whitespace-pre-wrap font-mono text-gray-800 break-words">
          {paste.content}
        </pre>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-gray-500">
        <div className="px-2 py-1 bg-gray-100 rounded">
          Views remaining: {paste.remaining_views ?? 'Unlimited'}
        </div>
        {paste.expires_at && (
          <div className="px-2 py-1 bg-gray-100 rounded">
            Expires: {new Date(paste.expires_at).toLocaleString()}
          </div>
        )}
      </div>
    </main>
  )
}