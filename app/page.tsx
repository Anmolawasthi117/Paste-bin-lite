"use client";

import { useState } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          ttl_seconds: ttl ? parseInt(ttl) : undefined,
          max_views: maxViews ? parseInt(maxViews) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
      setContent(""); // Clear form on success
      setTtl("");
      setMaxViews("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Pastebin-Lite</h1>
        <p className="text-gray-500">Create a temporary text paste and share it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-lg shadow-sm">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Content (Required)</label>
          <textarea
            required
            className="w-full h-40 p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Paste your text here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">TTL (Seconds)</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded"
              placeholder="Optional"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Max Views</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded"
              placeholder="Optional"
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Creating..." : "Create Paste"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg space-y-3 animate-in fade-in">
          <p className="font-semibold text-green-800">Paste created successfully!</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              className="flex-1 p-2 border rounded bg-white text-sm"
              value={result.url}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.url);
                alert("URL copied to clipboard!");
              }}
              className="px-4 py-2 bg-white border rounded text-sm hover:bg-gray-50 shadow-sm"
            >
              Copy
            </button>
          </div>
          <a
            href={`/p/${result.id}`}
            className="block text-center text-blue-600 hover:underline text-sm"
          >
            Go to Paste →
          </a>
        </div>
      )}
    </main>
  );
}