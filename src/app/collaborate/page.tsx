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
  faUsers,
  faPlus,
  faSignInAlt,
  faArrowLeft,
  faRandom,
  faCircleQuestion,
  faCode,
  faLock,
  faBolt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@mui/material/Tooltip";

/* ─────────────────────────────────────────────
   Animated floating particle background
───────────────────────────────────────────── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.45 + 0.1,
    }));

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${p.opacity})`;
        ctx.fill();
      });

      // Draw faint connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(147,197,253,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

/* ─────────────────────────────────────────────
   Feature badge chips
───────────────────────────────────────────── */
const features = [
  { icon: faBolt, label: "Real-time sync", color: "text-yellow-400" },
  { icon: faLock, label: "Secure rooms", color: "text-green-400" },
  { icon: faGlobe, label: "No account needed", color: "text-blue-400" },
  { icon: faCode, label: "Multi-language", color: "text-purple-400" },
];

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function CollaborateLobbyPage() {
  const router = useRouter();
  const { user } = usePlaygroundState();

  const [roomId, setRoomId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.username) {
      setDisplayName(user.username);
    } else {
      const saved = localStorage.getItem("collab_username");
      if (saved) {
        setDisplayName(saved);
      } else {
        const randomNick = `Coder-${Math.floor(1000 + Math.random() * 9000)}`;
        setDisplayName(randomNick);
        localStorage.setItem("collab_username", randomNick);
      }
    }
  }, [user]);

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    if (name.trim()) {
      localStorage.setItem("collab_username", name.trim());
    }
  };

  const generateRandomName = () => {
    const randomNick = `Coder-${Math.floor(1000 + Math.random() * 9000)}`;
    setDisplayName(randomNick);
    localStorage.setItem("collab_username", randomNick);
    toast.success(`Nickname set to ${randomNick}`);
  };

  const handleCreateRoom = () => {
    if (!displayName.trim()) {
      toast.error("Please enter a display name first.");
      return;
    }
    setIsCreating(true);
    const newId = uuidv4();
    toast.success("Creating collaboration room...");
    router.push(`/collaborate/${newId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter a display name first.");
      return;
    }

    let cleanedRoomId = roomId.trim();
    if (!cleanedRoomId) {
      toast.error("Please enter a valid Room ID.");
      return;
    }

    // Support pasted URLs
    if (cleanedRoomId.includes("/collaborate/")) {
      const parts = cleanedRoomId.split("/collaborate/");
      cleanedRoomId = parts[parts.length - 1];
    }

    router.push(`/collaborate/${cleanedRoomId}`);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-200 flex flex-col font-Roboto overflow-hidden">
      {/* Animated particle background */}
      <ParticleCanvas />

      {/* Radial glow accents */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[480px] h-[480px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[420px] h-[420px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[45%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 w-full backdrop-blur-md bg-slate-900/60 border-b border-slate-700/50 px-6 py-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md animate-pulse" />
            <Image
              src="/logo.png"
              alt="logo"
              width={44}
              height={44}
              className="relative w-10 h-10 object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bebas text-gray-100 tracking-wider font-header">
            CodingCorner
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/15 border border-green-500/30 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </span>
        </div>

        <Link
          href={user ? "/home" : "/"}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-600/60 transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/20 group"
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            width={12}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          <span>Back to {user ? "Dashboard" : "Home"}</span>
        </Link>
      </nav>

      {/* ── Main Content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Hero Section */}
        <div
          className={`text-center mb-10 transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionProperty: "opacity, transform" }}
        >
          {/* Icon ring */}
          <div className="flex justify-center mb-5">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 blur-xl animate-pulse" />
              <div
                className="absolute inset-0 rounded-full border border-blue-500/30"
                style={{ animation: "spin 8s linear infinite" }}
              />
              <div
                className="absolute inset-2 rounded-full border border-indigo-400/20"
                style={{ animation: "spin 5s linear infinite reverse" }}
              />
              <FontAwesomeIcon
                icon={faUsers}
                className="relative text-blue-400 text-3xl"
              />
            </div>
          </div>

          <h2 className="font-bebas text-4xl sm:text-5xl md:text-6xl text-gray-100 tracking-wider font-header mb-3 leading-none">
            Real-Time{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #22d3ee)" }}
            >
              Collaboration
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 flex items-center justify-center gap-2 max-w-md mx-auto">
            Code, pair-program, and sync edits with your team instantly
            <Tooltip title="Real-time synchronized editing powered by WebSockets. No account required.">
              <FontAwesomeIcon
                className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                width={15}
                icon={faCircleQuestion}
              />
            </Tooltip>
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/70 border border-slate-700/60 text-gray-300 hover:border-slate-500 transition-colors"
              >
                <FontAwesomeIcon icon={f.icon} className={f.color} width={11} />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Cards Container */}
        <div
          className={`w-full max-w-2xl transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionProperty: "opacity, transform", transitionDelay: "150ms" }}
        >
          {/* Display Name Box */}
          <div className="backdrop-blur-sm bg-slate-800/50 border border-slate-600/50 rounded-2xl p-5 mb-5 shadow-2xl hover:border-slate-500/60 transition-all duration-300">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Your Display Name
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your name"
                className="w-full sm:flex-1 p-3 bg-slate-900/70 border border-slate-600/60 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-roboto text-sm transition-all duration-200"
              />
              <button
                type="button"
                onClick={generateRandomName}
                className="w-full sm:w-auto px-4 py-3 bg-slate-700/70 hover:bg-slate-600/80 border border-slate-600/50 hover:border-slate-500 text-gray-200 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <FontAwesomeIcon
                  icon={faRandom}
                  width={13}
                  className="transition-transform duration-300 group-hover:rotate-180"
                />
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* Create / Join Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ── Create Room Card ── */}
            <div className="group backdrop-blur-sm bg-slate-800/50 border border-slate-600/50 rounded-2xl p-6 shadow-2xl flex flex-col justify-between hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-0.5">
              <div>
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-xl bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-300" />
                    <div className="absolute inset-0 rounded-xl border border-blue-500/30 group-hover:border-blue-500/50 transition-colors duration-300" />
                    <FontAwesomeIcon icon={faPlus} className="relative text-blue-400 text-base" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100">Create a Room</h3>
                    <p className="text-[11px] text-gray-500">Host a new session</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Start a new live collaborative session and invite others by sharing your unique Room ID.
                </p>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full relative overflow-hidden text-white font-semibold px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group/btn disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
                }}
              >
                {/* Shine sweep */}
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
                    transform: "translateX(-100%) skewX(-12deg)",
                    transition: "transform 0.7s",
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const parent = el.parentElement;
                    const enter = () => { el.style.transform = "translateX(200%) skewX(-12deg)"; };
                    const leave = () => { el.style.transform = "translateX(-100%) skewX(-12deg)"; };
                    parent?.addEventListener("mouseenter", enter);
                    parent?.addEventListener("mouseleave", leave);
                  }}
                />
                <FontAwesomeIcon icon={faPlus} width={14} />
                <span>{isCreating ? "Creating Room…" : "Create Room"}</span>
              </button>
            </div>

            {/* ── Join Room Card ── */}
            <div className="group backdrop-blur-sm bg-slate-800/50 border border-slate-600/50 rounded-2xl p-6 shadow-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5">
              <div>
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-xl bg-emerald-600/20 group-hover:bg-emerald-600/30 transition-colors duration-300" />
                    <div className="absolute inset-0 rounded-xl border border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors duration-300" />
                    <FontAwesomeIcon icon={faSignInAlt} className="relative text-emerald-400 text-base" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100">Join a Room</h3>
                    <p className="text-[11px] text-gray-500">Enter an existing session</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Enter a Room ID or paste a share link to jump into your team&apos;s live session.
                </p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Room ID or share link…"
                  className="w-full p-3 bg-slate-900/70 border border-slate-600/60 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-roboto text-sm transition-all duration-200"
                />
                <button
                  type="submit"
                  className="w-full relative overflow-hidden text-white font-semibold px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #059669, #047857)",
                    boxShadow: "0 4px 20px rgba(5,150,105,0.30)",
                  }}
                >
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
                      transform: "translateX(-100%) skewX(-12deg)",
                      transition: "transform 0.7s",
                    }}
                    ref={(el) => {
                      if (!el) return;
                      const parent = el.parentElement;
                      const enter = () => { el.style.transform = "translateX(200%) skewX(-12deg)"; };
                      const leave = () => { el.style.transform = "translateX(-100%) skewX(-12deg)"; };
                      parent?.addEventListener("mouseenter", enter);
                      parent?.addEventListener("mouseleave", leave);
                    }}
                  />
                  <FontAwesomeIcon icon={faUsers} width={16} />
                  <span>Join Room</span>
                </button>
              </form>
            </div>
          </div>

          {/* Bottom hint */}
          <p className="text-center text-xs text-gray-600 mt-6">
            Rooms are ephemeral — they exist only while participants are connected.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
