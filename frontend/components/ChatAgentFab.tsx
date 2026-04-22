"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ChatAgentFab() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm the Takhaial Agent. Ask me about Spatial Computing, our eight products, or how to deploy us inside your stack.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content:
            "The Takhaial Agent is offline right now. Make sure the backend is running on port 8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        aria-label="Open Takhaial AI Agent"
        onClick={() => setOpen((o) => !o)}
        className="glass-strong fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-glow"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 animate-pulseSoft rounded-full bg-violet-accent/15" />
        <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet-glow/30 via-transparent to-neon-red/20 blur-md" />
        <Image
          src="/logo.png"
          alt="Takhaial Agent"
          width={65}
          height={65}
          className="relative z-10 drop-shadow-[0_0_10px_rgba(138,107,255,0.6)]"
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="glass-strong fixed bottom-28 right-6 z-50 flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Takhaial"
                  width={28}
                  height={28}
                  className="drop-shadow-[0_0_8px_rgba(138,107,255,0.5)]"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Takhaial Agent</span>
                  <span className="flex items-center gap-1.5 text-[10px] tracking-wide text-white/40">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-glow opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-glow" />
                    </span>
                    Online · Visionary Intelligence
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6l-12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4 no-scrollbar"
            >
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              {loading && <TypingBubble />}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the agent anything…"
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-violet-glow/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-glow to-violet-accent text-white shadow-glow transition disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12l16-8-6 16-2-7-8-1z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ role, content }: { role: Message["role"]; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-violet-accent to-violet-glow text-white shadow-glow"
            : "border border-white/10 bg-white/5 text-white/85"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-white/70"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
