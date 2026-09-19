"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { usePlaygroundState } from "@/context/playgroundProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faPlus, faSignInAlt, faArrowLeft, faRandom, faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@mui/material/Tooltip";

/* ── Syntax palette (light / GitHub theme) ── */
const K = "#d73a49"; // keyword
const F = "#6f42c1"; // function / builtin
const S = "#032f62"; // string
const C = "#6a737d"; // comment
const N = "#005cc5"; // number
const P = "#24292e"; // default

type User = "Alice" | "Bob" | "Sam";
interface Token   { text: string; color: string }
interface CodeLine { tokens: Token[]; user: User | null; delay: number }

const USERS: Record<User, { color: string; bg: string }> = {
  Alice: { color: "#e11d48", bg: "#fff1f2" },
  Bob:   { color: "#2563eb", bg: "#eff6ff" },
  Sam:   { color: "#059669", bg: "#f0fdf4" },
};

/* ── Python code — plain, no framework ── */
const LINES: CodeLine[] = [
  { tokens: [{ text: "# scores.py  —  live session",               color: C }],                                                                                                 user: "Bob",   delay: 100  },
  { tokens: [{ text: "scores", color: P }, { text: " = [", color: P }, { text: "42", color: N }, { text: ", ", color: P }, { text: "85", color: N }, { text: ", ", color: P }, { text: "91", color: N }, { text: ", ", color: P }, { text: "67", color: N }, { text: ", ", color: P }, { text: "78", color: N }, { text: "]", color: P }],  user: "Bob",   delay: 380  },
  { tokens: [],                                                                                                                                                                   user: null,    delay: 630  },
  { tokens: [{ text: "def ", color: K }, { text: "analyze", color: F }, { text: "(data):", color: P }],                                                                         user: "Alice", delay: 820  },
  { tokens: [{ text: "    total", color: P }, { text: " = ", color: P }, { text: "sum", color: F }, { text: "(data)", color: P }],                                              user: "Alice", delay: 1060 },
  { tokens: [{ text: "    avg", color: P }, { text: " = total / ", color: P }, { text: "len", color: F }, { text: "(data)", color: P }],                                        user: "Sam",   delay: 1290 },
  { tokens: [{ text: "    best", color: P }, { text: " = ", color: P }, { text: "max", color: F }, { text: "(data)", color: P }],                                               user: "Sam",   delay: 1520 },
  { tokens: [{ text: "    ", color: P }, { text: "return ", color: K }, { text: "avg, best", color: P }],                                                                       user: "Alice", delay: 1750 },
  { tokens: [],                                                                                                                                                                   user: null,    delay: 2000 },
  { tokens: [{ text: "avg, best", color: P }, { text: " = ", color: P }, { text: "analyze", color: F }, { text: "(scores)", color: P }],                                        user: "Bob",   delay: 2180 },
  { tokens: [],                                                                                                                                                                   user: null,    delay: 2420 },
  { tokens: [{ text: "print", color: F }, { text: '(f"Average : {avg:.1f}")', color: S }],                                                                                      user: "Alice", delay: 2600 },
  { tokens: [{ text: "print", color: F }, { text: '(f"Top Score: {best}")',    color: S }],                                                                                     user: "Sam",   delay: 2840 },
];

/* ── Animated Editor ── */
function CollabEditor() {
  const [revealed, setRevealed] = useState<boolean[]>(Array(LINES.length).fill(false));
  const [tick, setTick]         = useState(0);

  useEffect(() => {
    const timers = LINES.map((_, i) =>
      setTimeout(() => setRevealed(prev => { const n = [...prev]; n[i] = true; return n; }), LINES[i].delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 550);
    return () => clearInterval(id);
  }, []);

  const cursorOn  = tick % 2 === 0;
  const allDone   = revealed.every(Boolean);
  const activeIdx = revealed.findIndex(r => !r);

  // Last revealed line per user
  const lastLine: Record<User, number> = { Alice: -1, Bob: -1, Sam: -1 };
  revealed.forEach((r, i) => { if (r && LINES[i].user) lastLine[LINES[i].user as User] = i; });

  return (
    <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white select-none font-mono text-[12.5px]">

      {/* Title bar */}
      <div className="bg-[#f6f8fa] px-4 py-2.5 flex items-center gap-2 border-b border-slate-200">
        <span className="w-3 h-3 rounded-full bg-red-400/90" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/90" />
        <span className="w-3 h-3 rounded-full bg-green-500/90" />
        <div className="ml-3 flex items-center gap-1.5 px-3 py-1 bg-white rounded-md border border-slate-200 text-[11px] text-slate-500 font-sans">
          <span>🐍</span>
          <span className="font-medium">scores.py</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {(Object.keys(USERS) as User[]).map(u => (
            <span key={u} className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full"
              style={{ color: USERS[u].color, background: USERS[u].bg, border: `1px solid ${USERS[u].color}35` }}>
              {u}
            </span>
          ))}
        </div>
      </div>

      {/* Code area */}
      <div className="bg-white py-2">
        {LINES.map((line, idx) => {
          const isRevealed   = revealed[idx];
          const isActive     = idx === activeIdx;
          const cursorsHere  = (Object.keys(lastLine) as User[]).filter(u => lastLine[u] === idx);
          const firstCursor  = cursorsHere[0];

          return (
            <div key={idx}
              className="flex items-center px-4 min-h-[22px] leading-[22px]"
              style={{
                backgroundColor: firstCursor ? USERS[firstCursor].bg + "88" : "transparent",
                transition: "background-color 0.5s ease",
              }}
            >
              {/* Line number */}
              <span className="w-6 shrink-0 mr-4 text-right text-[11px] text-slate-300 select-none font-sans">
                {idx + 1}
              </span>

              {/* Tokens + cursors */}
              <span className="whitespace-pre"
                style={{ opacity: isRevealed ? 1 : 0, transition: "opacity 0.4s ease" }}>
                {line.tokens.map((tok, ti) => (
                  <span key={ti} style={{ color: tok.color }}>{tok.text}</span>
                ))}

                {/* Per-user cursors with smooth blink */}
                {isRevealed && cursorsHere.map(u => (
                  <span key={u} className="relative inline-flex items-center ml-0.5">
                    <span className="inline-block w-[2px] h-[13px] rounded-sm"
                      style={{ background: USERS[u].color, opacity: cursorOn ? 1 : 0, transition: "opacity 0.2s ease-in-out" }} />
                    <span className="absolute -top-[18px] left-0 text-[9px] font-sans font-semibold px-1.5 py-px rounded whitespace-nowrap text-white"
                      style={{ background: USERS[u].color, transition: "all 0.3s ease" }}>
                      {u}
                    </span>
                  </span>
                ))}
              </span>

              {/* Generic typing cursor on the next unrevealed line */}
              {isActive && (
                <span className="inline-block w-[2px] h-[13px] rounded-sm ml-1 align-middle"
                  style={{ background: "#94a3b8", opacity: cursorOn ? 1 : 0, transition: "opacity 0.2s ease-in-out" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="bg-[#f6f8fa] border-t border-slate-200 px-4 py-1.5 flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[10px] font-sans text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full ${allDone ? "bg-green-500" : "bg-blue-500 animate-pulse"}`} />
          {allDone ? "✓  All changes synced" : "3 collaborators editing…"}
        </span>
        <span className="ml-auto text-[10px] font-sans text-slate-400">Python 3</span>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function CollaborateLobbyPage() {
  const router = useRouter();
  const { user } = usePlaygroundState();

  const [roomId,      setRoomId]      = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isCreating,  setIsCreating]  = useState(false);

  useEffect(() => {
    if (user?.username) {
      setDisplayName(user.username);
    } else {
      const saved = sessionStorage.getItem("collab_username") || localStorage.getItem("collab_username");
      if (saved) {
        setDisplayName(saved);
      }
    }
  }, [user]);

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    if (name.trim()) {
      sessionStorage.setItem("collab_username", name.trim());
      localStorage.setItem("collab_username", name.trim());
    }
  };

  const generateRandomName = () => {
    const nick = `Coder-${Math.floor(1000 + Math.random() * 9000)}`;
    setDisplayName(nick);
    sessionStorage.setItem("collab_username", nick);
    localStorage.setItem("collab_username", nick);
    toast.success(`Nickname set to ${nick}`);
  };

  const handleCreateRoom = () => {
    const finalName = displayName.trim() || `Coder-${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem("collab_username", finalName);
    localStorage.setItem("collab_username", finalName);
    setIsCreating(true);
    router.push(`/collaborate/${uuidv4()}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    let id = roomId.trim();
    if (!id) { toast.error("Please enter a valid Room ID."); return; }
    if (id.includes("/collaborate/")) id = id.split("/collaborate/").at(-1)!;
    const finalName = displayName.trim() || `Coder-${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem("collab_username", finalName);
    localStorage.setItem("collab_username", finalName);
    router.push(`/collaborate/${id}`);
  };

  /* ── 3D Tilt on editor ── */
  const tiltRef = useRef<HTMLDivElement>(null);

  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left - width  / 2) / (width  / 2); // -1 to 1
    const y = (e.clientY - top  - height / 2) / (height / 2); // -1 to 1
    const rotY =  x * 13;
    const rotX = -y * 9;
    el.style.transform  = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
    el.style.boxShadow  = `${-x * 22}px ${-y * 22}px 48px rgba(0,0,0,0.16), 0 4px 20px rgba(0,0,0,0.08)`;
    el.style.transition = "transform 0.1s ease-out, box-shadow 0.1s ease-out";
  };

  const handleTiltLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform  = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.boxShadow  = "0 8px 32px rgba(0,0,0,0.10)";
    el.style.transition = "transform 0.7s ease, box-shadow 0.7s ease";
  };

  return (
    <div className="w-full flex flex-col min-h-screen font-Roboto bg-[#e7f0fd]">

      {/* ── Navbar — identical to home page ── */}
      <div className="shrink-0 w-full bg-white border-b flex justify-between items-center shadow-sm px-4 py-2 md:px-8">
        <div className="flex items-center">
          <Image src="/logo.png" alt="CodingCorner Logo" width={64} height={64} className="w-12 md:w-16" />
          <h1 className="text-xl font-bebas md:text-2xl tracking-wide font-header">CodingCorner</h1>
        </div>
        <Link href={user ? "/home" : "/"}
          className="flex items-center gap-2 text-sm text-blue-500 hover:bg-[#3b82f5] hover:text-white px-3 py-2 rounded-md transition-colors duration-150 font-semibold">
          <FontAwesomeIcon icon={faArrowLeft} width={12} />
          <span>{user ? "Dashboard" : "Home"}</span>
        </Link>
      </div>

      {/* ── Content: scrollable on mobile, fills viewport on desktop ── */}
      <div className="flex flex-col lg:flex-row bg-[#e7f0fd] px-6 py-6 md:px-12 md:py-10 gap-10 lg:gap-12">

        {/* ─── Left: forms ─── */}
        <div className="flex flex-col justify-center flex-1">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-100 shadow-sm text-xs font-semibold text-blue-600 w-fit mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Collaboration
          </div>

          {/* Heading — Outfit font, clean mixed-case */}
          <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-slate-800 lg:whitespace-nowrap leading-tight mb-2">
            Collaborate in Real-Time
          </h2>
          <p className="font-heading text-sm text-slate-400 mb-5 flex items-center gap-1.5">
            Every keystroke synced instantly — no setup required
            <Tooltip title="Powered by WebSockets. No account needed.">
              <FontAwesomeIcon icon={faCircleQuestion} className="text-slate-300 hover:text-slate-500 cursor-pointer transition-colors" width={13} />
            </Tooltip>
          </p>

          {/* Display name */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Your Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Enter your name…"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-colors"
              />
              <button type="button" onClick={generateRandomName} title="Random nickname"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors duration-150">
                <FontAwesomeIcon icon={faRandom} width={13} />
              </button>
            </div>
          </div>

          {/* Create / Join grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Create */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faPlus} className="text-blue-500 text-xs" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Create a Room</p>
                  <p className="text-[11px] text-slate-400">Host a new session</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3 px-0.5">
                Start a fresh session and get a unique Room ID to share with teammates.
              </p>
              <button onClick={handleCreateRoom} disabled={isCreating}
                className="mt-auto w-full py-2 bg-[#3b82f5] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm">
                <FontAwesomeIcon icon={faPlus} width={12} />
                {isCreating ? "Creating…" : "Create Room"}
              </button>
            </div>

            {/* Join */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faSignInAlt} className="text-emerald-500 text-xs" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Join a Room</p>
                  <p className="text-[11px] text-slate-400">Enter an existing session</p>
                </div>
              </div>
              <form onSubmit={handleJoinRoom} className="space-y-2">
                <input type="text" value={roomId} onChange={e => setRoomId(e.target.value)}
                  placeholder="Room ID or share link…"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors" />
                <button type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm">
                  <FontAwesomeIcon icon={faUsers} width={13} />
                  Join Room
                </button>
              </form>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            No account needed · Rooms close when all participants leave
          </p>
        </div>

        {/* ─── Right: animated editor (desktop + mobile scroll) ─── */}
        <div className="flex flex-1 items-center justify-center pb-8 lg:pb-0">
          {/* Tilt wrapper */}
          <div
            ref={tiltRef}
            onMouseMove={handleTiltMove}
            onMouseLeave={handleTiltLeave}
            style={{ willChange: "transform", borderRadius: "1rem" }}
          >
            <CollabEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
