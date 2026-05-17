"use client";

import * as React from "react";

type UserEntry = {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  role?: string;
};

// Module-level cache: fetch once, share across all instances
let _usersCache: UserEntry[] | null = null;
let _usersPromise: Promise<UserEntry[]> | null = null;

async function fetchAllUsers(): Promise<UserEntry[]> {
  if (_usersCache) return _usersCache;
  if (_usersPromise) return _usersPromise;

  _usersPromise = fetch("/api/team")
    .then((res) => res.json())
    .then((json) => {
      if (json.success && json.data) {
        const users: UserEntry[] = json.data.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (u: any) => ({
            _id: u._id?.toString() || "",
            name: u.name || u.fullName || u.email || "Unknown",
            email: u.email || "",
            profileImage: u.profileImage || u.image || "",
            role: u.role || "",
          })
        );
        _usersCache = users;
        return users;
      }
      _usersPromise = null;
      return [];
    })
    .catch(() => {
      _usersPromise = null;
      return [];
    });

  return _usersPromise;
}

type Props = {
  /** Currently selected user ObjectId */
  value: string;
  /** Called with { _id, name, profileImage } or null on clear */
  onSelect: (user: UserEntry | null) => void;
  placeholder?: string;
  className?: string;
};

function UserAvatar({ src, name, size = 24 }: { src?: string; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "#E77000", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 600, flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function UserSelect({
  value,
  onSelect,
  placeholder = "Select user…",
  className = "",
}: Props) {
  const [users, setUsers] = React.useState<UserEntry[]>(() => _usersCache || []);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  // Fetch from cache
  React.useEffect(() => {
    let cancelled = false;
    fetchAllUsers().then((list) => {
      if (!cancelled) setUsers(list);
    });
    return () => { cancelled = true; };
  }, []);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const selected = users.find((u) => u._id === value);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div ref={ref} className={`ncb-option-select ${className}`} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        className="ncb-input"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          cursor: "pointer", textAlign: "left", width: "100%",
          justifyContent: "space-between",
        }}
      >
        {selected ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserAvatar src={selected.profileImage} name={selected.name} size={22} />
            <span style={{ fontSize: "0.85rem" }}>{selected.name}</span>
          </span>
        ) : (
          <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>{placeholder}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 50,
            maxHeight: 280, display: "flex", flexDirection: "column",
          }}
        >
          {/* Search */}
          <div style={{ padding: "8px 8px 4px" }}>
            <input
              autoFocus
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "6px 10px", fontSize: "0.82rem",
                border: "1px solid #e5e7eb", borderRadius: 6, outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = "#E77000"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Options */}
          <div style={{ overflow: "auto", flex: 1, padding: "4px 4px 6px" }}>
            {/* Clear option */}
            {selected && (
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false); setSearch(""); }}
                style={{
                  width: "100%", padding: "6px 10px", border: "none", background: "none",
                  cursor: "pointer", textAlign: "left", fontSize: "0.8rem",
                  color: "#9ca3af", borderRadius: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                ✕ Clear selection
              </button>
            )}

            {filtered.length === 0 && (
              <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "0.8rem" }}>
                No users found
              </div>
            )}

            {filtered.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => { onSelect(user); setOpen(false); setSearch(""); }}
                style={{
                  width: "100%", padding: "7px 10px", border: "none",
                  background: user._id === value ? "#fff7ed" : "none",
                  cursor: "pointer", textAlign: "left", borderRadius: 6,
                  display: "flex", alignItems: "center", gap: 10,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = user._id === value ? "#fff7ed" : "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = user._id === value ? "#fff7ed" : "none")}
              >
                <UserAvatar src={user.profileImage} name={user.name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#1f2937" }}>{user.name}</div>
                  {user.role && (
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{user.role}</div>
                  )}
                </div>
                {user._id === value && (
                  <span style={{ color: "#E77000", fontSize: "1rem" }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
