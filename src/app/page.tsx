"use client";

import Image from "next/image";
import Link from "next/link";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { usePlaygroundState } from "@/context/playgroundProvider";
import { useEffect, useState } from "react";
import RingLoader from "react-spinners/RingLoader";

function HomePage() {
  const { user } = usePlaygroundState();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#e7f0fd] flex justify-center items-center">
        <RingLoader color="#00b5d8" size={75} />
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col h-screen font-Roboto">
      <div className="w-full bg-white border flex justify-between items-center shadow-lg px-4 py-2 md:px-8">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="CodingCorner Logo"
            width={64}
            height={64}
            className="w-12 md:w-16"
          />
          <h1 className="text-xl font-bebas md:text-2xl tracking-wide font-header">
            CodingCorner
          </h1>
        </div>
        {user ? (
          <div>
            <h1>{user?.username}</h1>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <Link
              className="px-3 py-2 hover:border-black rounded-md hover:bg-[#3b82f5] transition delay-100 hover:text-gray-200 text-blue-500 text-sm md:text-lg font-semibold"
              href={"/login"}
            >
              Login
            </Link>
            <Link
              className="px-3 py-1 border rounded-md border-[#3b82f5] hover:bg-[#5576ac] transition delay-100 text-blue-500 hover:text-gray-200 text-sm md:text-lg"
              href={"/signup"}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      <div className="w-full h-full flex flex-col lg:flex-row justify-between p-4 md:p-12 bg-[#e7f0fd]">
        <div className="flex flex-col justify-center p-4 md:p-8 flex-1">
          <div className="relative w-full">
            <TypewriterEffectSmooth
              words={[{ text: "Begin Your Coding Adventure Today" }]}
            />
          </div>
          <p className="text-lg md:text-xl text-[#babbc1] mb-4 md:mb-6">
            Learn to code from scratch and unleash your creativity with every
            line.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {user ? (
              <Link
                href="/home"
                className="px-5 py-2.5 bg-[#3b82f5] hover:bg-[#2563eb] text-white font-semibold rounded-md shadow-md transition-colors duration-150 text-sm md:text-base"
              >
                Start Coding!
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 bg-[#3b82f5] hover:bg-[#2563eb] text-white font-semibold rounded-md shadow-md transition-colors duration-150 text-sm md:text-base"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Right: Animated mock code editor + CTA */}
        <div className="flex flex-col justify-center items-center gap-4 p-4 md:p-8 flex-1">
          <MockEditor />

          {/* Live Collaboration CTA — anchored right below the editor */}
          <div className="flex flex-col items-center gap-1.5">
            <Link
              href="/collaborate"
              className="flex items-center gap-2.5 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-150 text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Try Live Collaboration
              <span className="text-slate-400 text-xs font-normal">→</span>
            </Link>
            <p className="text-[11px] text-slate-400">No account needed · Free forever</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CODE_LINES = [
  { tokens: [{ text: "function ", color: "#c792ea" }, { text: "greet", color: "#82aaff" }, { text: "(", color: "#89ddff" }, { text: "name", color: "#f78c6c" }, { text: ") {", color: "#89ddff" }] },
  { tokens: [{ text: "  const ", color: "#c792ea" }, { text: "msg", color: "#eeffff" }, { text: " = ", color: "#89ddff" }, { text: "`Hello, ", color: "#c3e88d" }, { text: "${", color: "#89ddff" }, { text: "name", color: "#f78c6c" }, { text: "}", color: "#89ddff" }, { text: "!`", color: "#c3e88d" }] },
  { tokens: [{ text: "  console", color: "#eeffff" }, { text: ".", color: "#89ddff" }, { text: "log", color: "#82aaff" }, { text: "(msg);", color: "#89ddff" }] },
  { tokens: [{ text: "}", color: "#89ddff" }] },
  { tokens: [] },
  { tokens: [{ text: "// 👥 Alice joined the session", color: "#546e7a" }] },
  { tokens: [{ text: "greet", color: "#82aaff" }, { text: "(", color: "#89ddff" }, { text: '"World"', color: "#c3e88d" }, { text: ");", color: "#89ddff" }] },
];

const CURSORS = [
  { name: "Alice", color: "#f472b6", line: 6 },
  { name: "Bob",   color: "#34d399", line: 3 },
];

function MockEditor() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (visibleLines >= CODE_LINES.length) return;
    const id = setTimeout(() => setVisibleLines((v) => v + 1), 340);
    return () => clearTimeout(id);
  }, [visibleLines]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 530);
    return () => clearInterval(id);
  }, []);

  const cursorVisible = tick % 2 === 0;

  return (
    <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 font-mono text-sm select-none">
      <div className="bg-[#1e1e2e] px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/50">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-slate-400">index.js — CodingCorner</span>
        <div className="ml-auto flex items-center gap-1.5">
          {CURSORS.map((c) => (
            <span
              key={c.name}
              className="text-[10px] font-sans px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: c.color + "28",
                color: c.color,
                border: `1px solid ${c.color}55`,
              }}
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-[#1e1e2e] px-0 py-3">
        {CODE_LINES.map((line, lineIdx) => {
          const isVisible = lineIdx < visibleLines;
          const isTyping = lineIdx === visibleLines;
          const cursorOnLine = CURSORS.filter((c) => c.line === lineIdx);

          return (
            <div
              key={lineIdx}
              className="flex items-center px-4 py-[2px] leading-6 min-h-[24px] hover:bg-white/[0.03] transition-colors"
            >
              <span className="w-6 text-right text-[#3d3d5c] text-xs mr-4 shrink-0">
                {lineIdx + 1}
              </span>

              <span className="whitespace-pre">
                {isVisible &&
                  line.tokens.map((tok, ti) => (
                    <span key={ti} style={{ color: tok.color }}>
                      {tok.text}
                    </span>
                  ))}

                {isTyping && (
                  <span
                    className="inline-block w-[2px] h-[14px] ml-0.5 rounded-sm align-middle"
                    style={{
                      background: "#60a5fa",
                      opacity: cursorVisible ? 1 : 0,
                      transition: "opacity 0.1s",
                    }}
                  />
                )}

                {isVisible &&
                  cursorOnLine.map((c) => (
                    <span
                      key={c.name}
                      className="relative inline-flex items-center ml-0.5"
                    >
                      <span
                        className="inline-block w-[2px] h-[14px] rounded-sm"
                        style={{
                          background: c.color,
                          opacity: cursorVisible ? 1 : 0,
                          transition: "opacity 0.1s",
                        }}
                      />
                      <span
                        className="absolute -top-4 left-0 text-[9px] font-sans px-1 rounded whitespace-nowrap font-semibold"
                        style={{ background: c.color, color: "#fff" }}
                      >
                        {c.name}
                      </span>
                    </span>
                  ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-[#181825] px-4 py-1.5 flex items-center gap-3 border-t border-slate-700/50">
        <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {CURSORS.length + 1} collaborators online
        </span>
        <span className="ml-auto text-[10px] text-slate-500 font-sans">
          JavaScript
        </span>
      </div>
    </div>
  );
}

export default HomePage;
