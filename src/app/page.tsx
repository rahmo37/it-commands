"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Cmd = {
  id: string;
  title: string;
  commandText: string;
  platform: "windows" | "powershell" | "linux" | "mac" | "network";
  tags: string[];
  notes?: string | null;
};

const PLATFORMS: Array<Cmd["platform"]> = [
  "windows",
  "powershell",
  "linux",
  "mac",
  "network",
];

const PLATFORM_ICON: Record<Cmd["platform"], string> = {
  windows: "🪟",
  powershell: "🧩",
  linux: "🐧",
  mac: "🍎",
  network: "🌐",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [items, setItems] = useState<Cmd[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCommandText, setEditCommandText] = useState("");
  const [editPlatform, setEditPlatform] = useState<Cmd["platform"]>("windows");
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string>("");

  // admin key handling
  const [savedAdminKey, setSavedAdminKey] = useState<string>("");
  const [adminPromptOpen, setAdminPromptOpen] = useState(false);
  const [adminPromptValue, setAdminPromptValue] = useState("");

  // toast/message
  const [msg, setMsg] = useState<string | null>(null);
  const setToast = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 1200);
  };

  // Load any previously-saved admin key
  useEffect(() => {
    const k = localStorage.getItem("adminKey") || "";
    setSavedAdminKey(k);
  }, []);

  // Press "/" to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        (document.getElementById("search") as HTMLInputElement)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load items
  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (platform) params.set("platform", platform);
    const res = await fetch(`/api/commands?${params.toString()}`);
    const data = res.ok ? ((await res.json()) as Cmd[]) : [];
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, platform]);

  const onCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1000);
  };

  const platformPills = useMemo(() => ["", ...PLATFORMS] as string[], []);

  // ---- Edit flow ----
  const beginEdit = (c: Cmd) => {
    setEditingId(c.id);
    setEditTitle(c.title);
    setEditCommandText(c.commandText);
    setEditPlatform(c.platform);
    setEditTags(c.tags?.join(", ") || "");
    setEditNotes(c.notes || "");
  };

  const cancelEdit = () => setEditingId(null);

  // Save edit (will open admin modal if no key saved)
  const saveEdit = async () => {
    if (!editingId) return;
    if (!savedAdminKey) {
      setAdminPromptValue("");
      setAdminPromptOpen(true);
      return;
    }
    await actuallySaveEdit(savedAdminKey);
  };

  const actuallySaveEdit = async (adminKey: string) => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/commands/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          title: editTitle,
          commandText: editCommandText,
          platform: editPlatform,
          tags: editTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          notes: editNotes || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setToast("Updated ✓");
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      setToast("Update failed");
    }
  };

  // ---- Delete flow ----
  const askDelete = (c: Cmd) => {
    setDeleteId(c.id);
    setDeleteTitle(c.title);
  };

  const confirmDelete = async (adminKey: string) => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/commands/${deleteId}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      setToast("Deleted ✓");
      setDeleteId(null);
      await load();
    } catch (e) {
      console.error(e);
      setToast("Delete failed");
    }
  };

  return (
    <main className="relative min-h-screen text-zinc-100 antialiased">
      {/* Background */}
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
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: logo/title */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/30 grid place-items-center">
                <span className="text-lg">⌘</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Commander — IT Commands
                </h1>
                <p className="text-xs text-zinc-400">
                  Type <span className="rounded bg-zinc-800/70 px-1">/</span> to
                  focus · copy · edit/delete
                </p>
              </div>
            </div>

            {/* Right: search + admin */}
            <div className="flex w-full sm:w-auto items-center gap-3">
              <div className="relative w-full sm:w-[520px]">
                <input
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search command text or tags (e.g., ipconfig or dns)…"
                  className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 pl-10 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 transition"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  🔎
                </span>
              </div>

              <Link
                href="/admin"
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100 hover:border-indigo-400/60 hover:bg-indigo-500/10 transition"
                title="Admin — add commands"
              >
                Admin
              </Link>
            </div>
          </div>

          {/* Platform pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {platformPills.map((p) => {
              const active = platform === p || (p === "" && platform === "");
              const label = p === "" ? "All" : p;
              return (
                <button
                  key={p || "all"}
                  onClick={() => setPlatform(p)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    active
                      ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-100 shadow-[0_0_0_1px_rgba(99,102,241,.12)_inset]"
                      : "border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:bg-zinc-800/60",
                  ].join(" ")}
                >
                  {p && (
                    <span className="mr-1">
                      {PLATFORM_ICON[p as Cmd["platform"]]}
                    </span>
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {loading && (
          <div className="mb-4 text-sm text-zinc-300/80">Searching…</div>
        )}

        {items.length === 0 && !loading ? (
          <div className="mt-16 text-center text-zinc-300/80">
            No commands found. Try a different term or switch platform.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4">
            {items.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <li
                  key={c.id}
                  className="group rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-indigo-400/40 hover:bg-zinc-900/80"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-black/30 ring-1 ring-white/10">
                        <span className="text-lg">
                          {PLATFORM_ICON[c.platform]}
                        </span>
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-lg bg-zinc-900 px-2 py-1 text-base font-medium ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        ) : (
                          <div className="text-base font-medium leading-tight">
                            {c.title}
                          </div>
                        )}
                        <div className="text-[11px] uppercase tracking-wide text-zinc-400">
                          {isEditing ? (
                            <select
                              value={editPlatform}
                              onChange={(e) =>
                                setEditPlatform(
                                  e.target.value as Cmd["platform"]
                                )
                              }
                              className="mt-1 rounded bg-zinc-900 px-2 py-1 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              {PLATFORMS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          ) : (
                            c.platform
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => onCopy(c.id, c.commandText)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100 transition hover:border-indigo-400/60 hover:bg-indigo-500/10 active:scale-95"
                            title="Copy command"
                          >
                            {copiedId === c.id ? "Copied ✓" : "Copy"}
                          </button>
                          <button
                            onClick={() => beginEdit(c)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-amber-400/60 hover:bg-amber-500/10"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => askDelete(c)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-rose-400/60 hover:bg-rose-500/10"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={saveEdit}
                            className="rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-3 py-2 text-sm hover:bg-emerald-500/25"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-zinc-400/60 hover:bg-zinc-700/30"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Command / Notes / Tags */}
                  <div className="mt-3">
                    {isEditing ? (
                      <textarea
                        value={editCommandText}
                        onChange={(e) => setEditCommandText(e.target.value)}
                        className="h-28 w-full whitespace-pre-wrap rounded-xl bg-black/40 p-3 text-sm ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap rounded-xl bg-black/40 p-3 text-sm ring-1 ring-white/10">
                        {c.commandText}
                      </pre>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-zinc-400 mb-1">Tags</div>
                      {isEditing ? (
                        <input
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          className="w-full rounded-lg bg-zinc-900 px-2 py-2 text-sm ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="dns, cache"
                        />
                      ) : c.tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-zinc-800/80 px-2 py-1 text-xs text-zinc-300 ring-1 ring-white/10"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500">—</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400 mb-1">Notes</div>
                      {isEditing ? (
                        <input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full rounded-lg bg-zinc-900 px-2 py-2 text-sm ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Short description"
                        />
                      ) : c.notes ? (
                        <p className="text-sm text-zinc-200/90">{c.notes}</p>
                      ) : (
                        <div className="text-sm text-zinc-500">—</div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Admin Key Modal (for Save when key not stored) */}
      {adminPromptOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/90 p-5">
            <h3 className="text-lg font-semibold">Admin key required</h3>
            <p className="mt-1 text-sm text-zinc-300">
              Enter your{" "}
              <code className="rounded bg-zinc-800 px-1">ADMIN_KEY</code> to
              save changes. It will be stored locally in your browser.
            </p>
            <input
              value={adminPromptValue}
              onChange={(e) => setAdminPromptValue(e.target.value)}
              type="password"
              className="mt-3 w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Enter ADMIN_KEY"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setAdminPromptOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-zinc-400/60 hover:bg-zinc-700/30"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const key = adminPromptValue.trim();
                  if (!key) return;
                  localStorage.setItem("adminKey", key);
                  setSavedAdminKey(key);
                  setAdminPromptOpen(false);
                  await actuallySaveEdit(key);
                }}
                className="rounded-xl border border-indigo-400/60 bg-indigo-500/15 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-500/25"
              >
                Use Key & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal (always requires key) */}
      {deleteId && (
        <DeleteModal
          title={deleteTitle}
          onCancel={() => setDeleteId(null)}
          onConfirm={(key) => confirmDelete(key)}
        />
      )}

      {/* Toasts */}
      {copiedId && (
        <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="rounded-xl border border-indigo-400/40 bg-zinc-900/90 px-4 py-2 text-sm text-indigo-100 shadow-lg">
            Command copied to clipboard
          </div>
        </div>
      )}
      {msg && (
        <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-2 text-sm text-zinc-100 shadow-lg">
            {msg}
          </div>
        </div>
      )}
    </main>
  );
}

/* --- Delete Modal Component --- */
function DeleteModal({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: (adminKey: string) => void;
}) {
  const [key, setKey] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/90 p-5">
        <h3 className="text-lg font-semibold">Confirm delete</h3>
        <p className="mt-1 text-sm text-zinc-300">
          You are about to delete <span className="font-medium">“{title}”</span>
          . Please enter your{" "}
          <code className="rounded bg-zinc-800 px-1">ADMIN_KEY</code> to
          proceed.
        </p>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          type="password"
          className="mt-3 w-full rounded-xl bg-zinc-900 px-3 py-2 ring-1 ring-zinc-800 focus:ring-2 focus:ring-rose-500 outline-none"
          placeholder="Enter ADMIN_KEY"
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-zinc-400/60 hover:bg-zinc-700/30"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(key.trim())}
            className="rounded-xl border border-rose-400/60 bg-rose-500/15 px-3 py-2 text-sm text-rose-100 hover:bg-rose-500/25"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
