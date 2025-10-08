"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Platform = "windows" | "powershell" | "linux" | "mac" | "network";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [title, setTitle] = useState("");
  const [commandText, setCommandText] = useState("");
  const [platform, setPlatform] = useState<Platform>("windows");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const k = localStorage.getItem("adminKey");
    if (k) setAdminKey(k);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          title,
          commandText,
          platform,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      setMsg("Saved ✓");
      setTitle("");
      setCommandText("");
      setTags("");
      setNotes("");
      localStorage.setItem("adminKey", adminKey);
    } catch (e: any) {
      setMsg(`Failed: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 1200);
    }
  };

  return (
    <main className="relative min-h-screen text-zinc-100 antialiased">
      {/* Background to match the main page */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[radial-gradient(1200px_600px_at_10%_0%,rgba(99,102,241,0.20),transparent_60%),radial-gradient(1000px_500px_at_90%_20%,rgba(34,197,94,0.20),transparent_60%),radial-gradient(800px_500px_at_50%_100%,rgba(244,63,94,0.18),transparent_60%),linear-gradient(180deg,#0a0a0b_0%,#0d0d10_100%)]
        "
      />
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 opacity-[0.15]
          bg-[linear-gradient(to_right,rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.12)_1px,transparent_1px)]
          [background-size:28px_28px]
        "
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/40 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/30 grid place-items-center">
              <span className="text-lg">⚙️</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Admin — Add Command
              </h1>
              <p className="text-xs text-zinc-400">
                Paste your admin key once; it stays in your browser only.
              </p>
            </div>
          </div>

          {/* Back button */}
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100 hover:border-indigo-400/60 hover:bg-indigo-500/10 transition"
            title="Back to dashboard"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Form */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-5"
        >
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Admin Key
            </label>
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Paste ADMIN_KEY from your .env"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Header used: <code>x-admin-key</code>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., Flush DNS"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="windows">windows</option>
                <option value="powershell">powershell</option>
                <option value="linux">linux</option>
                <option value="mac">mac</option>
                <option value="network">network</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-zinc-300">
                Command Text
              </label>
              <textarea
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                className="h-28 w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., ipconfig /flushdns"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">
                Tags (comma-separated)
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="dns, cache"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">
                Notes (optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Short description"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              disabled={saving}
              className="rounded-xl border border-indigo-400/50 bg-indigo-500/15 px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-500/25 disabled:opacity-60"
              type="submit"
            >
              {saving ? "Saving…" : "Add Command"}
            </button>
            {msg && <span className="text-sm text-zinc-300">{msg}</span>}
          </div>
        </form>
      </div>
    </main>
  );
}
