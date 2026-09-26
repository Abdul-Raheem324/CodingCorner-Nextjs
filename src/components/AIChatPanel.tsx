"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  X,
  Sparkles,
  Lightbulb,
  Bug,
  Copy,
  Check,
  FileCode,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIChatPanelProps {
  roomId: string;
  language: string;
  members: string[];
  currentUser: string;
  getFullCode: () => string;
  getSelectedText: () => string;
  getAuthorMap?: () => Record<string | number, string>;
  onClose: () => void;
}

// ── Code block with Copy button ────────────────────────────────────────────────

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-[#2c2c34] bg-[#101013] text-white">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#17171c] border-b border-[#2c2c34] text-[11px]">
        <span className="font-mono text-neutral-400 font-medium uppercase text-[10px] tracking-wider">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-[#23232a]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] font-mono text-neutral-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Markdown Parser & Renderer ─────────────────────────────────────────────────

function parseFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#2b2b32] text-sky-300 border border-[#3b3b45]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <CodeBlock
          key={`code-${i}`}
          language={lang}
          code={codeLines.join("\n")}
        />
      );
    } else if (line.startsWith("### ")) {
      nodes.push(
        <h4 key={i} className="text-xs font-semibold text-neutral-200 mt-2 mb-1">
          {parseFormattedText(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ") || line.startsWith("# ")) {
      nodes.push(
        <h3 key={i} className="text-sm font-semibold text-white mt-2.5 mb-1">
          {parseFormattedText(line.replace(/^#+\s/, ""))}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
          <div className="text-[13px] text-neutral-200 leading-relaxed flex-1">
            {parseFormattedText(line.slice(2))}
          </div>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. /);
      const num = match ? match[1] : "1";
      nodes.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="text-[11px] font-mono text-neutral-400 w-4 text-right shrink-0 mt-0.5">
            {num}.
          </span>
          <div className="text-[13px] text-neutral-200 leading-relaxed flex-1">
            {parseFormattedText(line.replace(/^\d+\. /, ""))}
          </div>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />);
    } else {
      nodes.push(
        <p key={i} className="text-[13px] text-neutral-200 leading-relaxed">
          {parseFormattedText(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1">{nodes}</div>;
}

// ── Typing Indicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

// ── Quick Prompt Chips ─────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  {
    icon: Lightbulb,
    label: "Explain this code",
    query: "Explain this code in detail and break down how it works.",
  },
  {
    icon: Bug,
    label: "Find bugs and issues",
    query: "Find potential bugs, edge cases, and issues in this code.",
  },
  {
    icon: Sparkles,
    label: "Suggest improvements",
    query: "Suggest optimizations, cleaner patterns, and improvements for this code.",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AIChatPanel({
  roomId,
  language,
  members,
  currentUser,
  getFullCode,
  getSelectedText,
  getAuthorMap: _getAuthorMap,
  onClose,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I can explain code, spot bugs, and suggest improvements for this session.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);

  const dismissedSnippetRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const refreshSelection = useCallback(() => {
    const sel = getSelectedText()?.trim();
    if (!sel) {
      setSelectedSnippet(null);
      dismissedSnippetRef.current = null;
      return;
    }
    if (sel !== dismissedSnippetRef.current) {
      setSelectedSnippet(sel);
    }
  }, [getSelectedText]);

  useEffect(() => {
    const interval = setInterval(refreshSelection, 600);
    return () => clearInterval(interval);
  }, [refreshSelection]);

  const handleDismissSelection = () => {
    dismissedSnippetRef.current = selectedSnippet;
    setSelectedSnippet(null);
  };

  const sendMessage = async (overrideText?: string) => {
    const question = (overrideText ?? input).trim();
    if (!question || loading) return;

    if (!overrideText) setInput("");
    setLoading(true);

    const userMsgId = crypto.randomUUID();
    const aiMsgId   = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user",      content: question, timestamp: new Date() },
      { id: aiMsgId,   role: "assistant", content: "",        timestamp: new Date(), isStreaming: true },
    ]);

    try {
      const snippet = selectedSnippet?.trim() || getSelectedText()?.trim() || undefined;

      const res = await fetch("/api/ai/collab-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          question,
          language,
          members,
          currentUser,
          fullCode: getFullCode(),
          selectedText: snippet,
        }),
      });

      if (!res.ok || !res.body) {
        // Non-streaming error (400 / 500)
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: `Error: ${data.error ?? "Failed to get response"}`, isStreaming: false }
              : m
          )
        );
        return;
      }

      // ── Consume the stream token by token ──────────────────────────────
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        // Update the AI message live as tokens arrive
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: accumulated, isStreaming: false } // hide typing dots once first token lands
              : m
          )
        );
      }

      // Flush any remaining bytes
      accumulated += decoder.decode();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: accumulated, isStreaming: false } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: "Network error — please try again.", isStreaming: false }
            : m
        )
      );
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasOnlyWelcome = messages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-[#161618] text-white rounded-2xl overflow-hidden font-sans border border-[#26262a] shadow-2xl">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#26262a] bg-[#161618] shrink-0">
        <div className="flex items-center gap-3">
          {/* Sparkle Icon in dark blue circle */}
          <div className="w-9 h-9 rounded-full bg-[#0a2342] border border-[#0d3b6e]/40 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white leading-tight">
              Room AI
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-[#a1a1aa] font-normal leading-none">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          title="Close"
          className="text-[#71717a] hover:text-white transition-colors p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Chat Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            {msg.role === "assistant" ? (
              /* Assistant message */
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#0a2342] border border-[#0d3b6e]/40 flex items-center justify-center text-[#38bdf8] shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                </div>
                <div className="bg-[#1f1f23] border border-[#2b2b32] rounded-2xl px-4 py-3 text-white text-[13.5px] leading-relaxed max-w-[88%] shadow-sm">
                  {msg.isStreaming ? (
                    <TypingIndicator />
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>
              </div>
            ) : (
              /* User message */
              <div className="flex justify-end">
                <div className="bg-[#2563eb] text-white font-medium text-[13.5px] rounded-2xl px-4 py-2.5 shadow-sm max-w-[85%] break-words leading-relaxed">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── Quick Action Buttons (shown initially as in image) ──────────── */}
        {hasOnlyWelcome && (
          <div className="space-y-2 pt-1">
            {PROMPT_CHIPS.map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <button
                  key={idx}
                  onClick={() => sendMessage(chip.label)}
                  className="w-full bg-[#1b1b1f] hover:bg-[#222227] border border-[#2b2b33] rounded-xl px-4 py-2.5 text-left text-white font-medium text-[13.5px] flex items-center gap-2.5 transition-all duration-150 active:scale-[0.99] group shadow-xs"
                >
                  <Icon className="w-4 h-4 text-neutral-300 group-hover:text-white shrink-0" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Bottom Input Area ─────────────────────────────────────────────── */}
      <div className="p-3 border-t border-[#26262a] bg-[#161618] shrink-0 space-y-2">
        {/* Attached Code Context Pill (near input field) */}
        {selectedSnippet && (
          <div className="px-3 py-1.5 rounded-xl bg-[#1d1d22] border border-[#2d2d36] flex items-center justify-between text-xs text-neutral-300 transition-all">
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate text-[11px] font-mono text-neutral-300">
                Attached: {selectedSnippet.slice(0, 45)}
                {selectedSnippet.length > 45 ? "…" : ""}
              </span>
            </div>
            <button
              onClick={handleDismissSelection}
              title="Remove attached code"
              className="text-neutral-400 hover:text-white p-0.5 ml-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center bg-[#131315] border border-[#27272d] focus-within:border-blue-500/70 rounded-2xl px-3.5 py-1.5 transition-colors shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this session"
            className="flex-1 bg-transparent text-[13.5px] text-white placeholder-[#585863] outline-none py-1.5"
          />
          <button
            id="ai-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            title="Send"
            className="w-8 h-8 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 ml-2 transition-all disabled:opacity-35 disabled:hover:bg-[#2563eb] active:scale-95 shadow-sm"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
