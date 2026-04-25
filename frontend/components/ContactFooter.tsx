"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Turnstile } from "@marsidev/react-turnstile";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type FormState = {
  name: string;
  email: string;
  company: string;
  message: string;
  website: string; // honeypot — never shown to users
};

type Status = "idle" | "loading" | "success" | "error";

export default function ContactFooter() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    message: "",
    website: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const turnstileToken = useRef<string>("");
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side trim + min-length guard
    const trimmed = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      message: form.message.trim(),
    };
    if (!trimmed.name || !trimmed.email || trimmed.message.length < 10) {
      setStatus("error");
      setError("Please fill in all required fields. Message must be at least 10 characters.");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trimmed, cf_turnstile_token: turnstileToken.current }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { reference_id: string };
      setReference(data.reference_id);
      setStatus("success");
      setForm({ name: "", email: "", company: "", message: "", website: "" });
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again later.");
    }
  };

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass-strong relative overflow-hidden rounded-3xl p-10 md:p-16"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-neon-red/20 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col gap-5">
              <span className="eyebrow">Chapter 05 · Contact</span>
              <h2 className="text-balance text-4xl font-light leading-tight text-white md:text-5xl">
                Build the spatial future
                <span className="text-neon-red">.</span>
                <br />
                <span className="text-white/55">With us.</span>
              </h2>
              <p className="max-w-md text-sm font-light text-white/55">
                Tell us what you&apos;re trying to see, feel, or simulate. We&apos;ll
                route you to the right Takhaial product team within one working
                day.
              </p>

            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {/* Honeypot — hidden from real users, bots fill it */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={update("website")}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                }}
              />

              <Field
                label="Full name"
                value={form.name}
                onChange={update("name")}
                required
                placeholder="Ada Lovelace"
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                required
                placeholder="ada@company.com"
              />
              <Field
                label="Company"
                value={form.company}
                onChange={update("company")}
                placeholder="Company (optional)"
              />
              <TextAreaField
                label="Message"
                value={form.message}
                onChange={update("message")}
                required
                placeholder="Tell us what you want to build…"
              />

              {/* Cloudflare Turnstile — only renders when site key is configured */}
              {TURNSTILE_SITE_KEY && (
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => { turnstileToken.current = token; setTurnstileReady(true); }}
                  onError={() => setTurnstileReady(false)}
                  onExpire={() => setTurnstileReady(false)}
                  options={{ theme: "dark" }}
                />
              )}

              <button
                type="submit"
                disabled={status === "loading" || !turnstileReady}
                className="group relative mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-accent via-violet-glow to-neon-red px-6 py-3 text-sm font-medium text-white shadow-glow transition hover:shadow-[0_0_60px_rgba(107,76,230,0.45)] disabled:opacity-60"
              >
                {status === "loading" ? "Transmitting…" : "Send transmission"}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>

              {status === "success" && reference && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-violet-glow/30 bg-violet-accent/10 p-4 text-sm text-white/80"
                >
                  Received. Reference:{" "}
                  <span className="font-mono text-violet-glow">{reference}</span>
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-neon-red/40 bg-neon-red/10 p-4 text-sm text-white/80"
                >
                  {error ?? "Something went wrong."}
                </motion.div>
              )}
            </form>
          </div>
        </motion.div>
      </div>

      <Footer />
    </section>
  );
}

function Field({
  label,
  type = "text",
  ...props
}: {
  label: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="eyebrow text-white/50">{label}</span>
      <input
        type={type}
        {...props}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-glow/50 focus:outline-none"
      />
    </label>
  );
}

function TextAreaField({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="eyebrow text-white/50">{label}</span>
      <textarea
        rows={4}
        {...props}
        className="resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-glow/50 focus:outline-none"
      />
    </label>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-900/70 backdrop-blur-heavy">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Takhaial"
              width={32}
              height={32}
              className="drop-shadow-[0_0_10px_rgba(138,107,255,0.45)]"
            />
            <span className="tracked text-xs text-white/70">Takhaial</span>
          </div>
          <p className="max-w-sm text-sm font-light text-white/50">
            Visionary Intelligence. The operating system of the spatial web —
            engineered at the intersection of AI and spatial computing.
          </p>
        </div>

        <FooterColumn
          title="Products"
          items={[
            "Closr",
            "Eikon",
            "Metis",
            "Atlas",
            "Lucid",
            "Vivid",
            "Nexus",
            "Vizor",
          ]}
        />
        <FooterColumn
          title="Company"
          items={["About", "Careers", "Press", "Research", "Contact"]}
        />
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-[11px] tracking-widest text-white/40 md:flex-row">
          <div>© {new Date().getFullYear()} TAKHAIAL · ALL RIGHTS RESERVED</div>
          <div className="flex items-center gap-4">
            <span>PRIVACY</span>
            <span>TERMS</span>
            <span>STATUS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="eyebrow text-white/40">{title}</span>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="cursor-pointer text-sm text-white/65 transition hover:text-white"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
