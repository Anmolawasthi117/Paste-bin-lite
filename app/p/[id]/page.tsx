import { notFound } from 'next/navigation'

export default async function ViewPaste(
  { params }: { params: Promise<{ id: string }> } // Change type to Promise
) {
  // 1. Await the params first!
  const { id } = await params;

  // 2. Determine base URL (Next.js 15 tip: use localhost for local testing)
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'

  // 3. Fetch from our API
  const res = await fetch(`${baseUrl}/api/pastes/${id}`, { cache: 'no-store' })
  
  if (!res.ok) return notFound()
  const paste = await res.json()

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="p-6 bg-gray-100 rounded border whitespace-pre-wrap font-mono text-gray-800">
        {paste.content}
      </div>
      <div className="mt-4 text-sm text-gray-500 flex justify-between">
        <span>Views remaining: {paste.remaining_views ?? 'Unlimited'}</span>
        {paste.expires_at && (
           <span>Expires: {new Date(paste.expires_at).toLocaleString()}</span>
        )}
      </div>
    </main>
  )
}