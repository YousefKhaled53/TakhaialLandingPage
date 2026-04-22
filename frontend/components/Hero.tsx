"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center px-6 pt-28">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-3"
        >
          <span className="eyebrow">Takhaial · Deep Tech</span>
          <span className="h-[1px] w-10 bg-white/20" />
          <span className="eyebrow text-violet-glow">Visionary Intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-balance text-5xl font-light leading-[1.02] tracking-tight text-white sm:text-7xl md:text-[6.5rem]"
        >
          Visionary
          <br />
          <span className="bg-gradient-to-br from-white via-white/80 to-violet-glow bg-clip-text text-transparent">
            Intelligence
          </span>
          <span className="relative inline-block align-top">
            <span className="ml-2 inline-block h-3 w-3 translate-y-3 rounded-full bg-neon-red shadow-[0_0_20px_6px_rgba(255,51,102,0.55)]" />
            <span className="text-neon-red">.</span>
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass-strong flex items-center gap-4 rounded-full px-6 py-3"
        >
          <Image
            src="/logo.png"
            alt="Takhaial"
            width={50}
            height={50}
            className="drop-shadow-[0_0_8px_rgba(138,107,255,0.5)]"
          />
          <span className="tracked text-[11px] text-white/60">Takhaial</span>
          <span className="h-4 w-px bg-white/15" />
          <span className="text-[11px] font-light text-white/50">
            Spatial Computing · AI · XR
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-2xl text-balance text-lg font-light leading-relaxed text-white/55 sm:text-xl"
        >
          We fuse Spatial Computing and Artificial Intelligence into a single,
          living interface — so that machines don&apos;t just respond to you,
          they perceive the space you live in.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-6 flex items-center gap-3 text-xs tracking-wide text-white/45"
        >
          <span className="h-[1px] w-8 bg-white/25" />
          <span>Scroll to enter</span>
          <span className="h-[1px] w-8 bg-white/25" />
        </motion.div>
      </div>
    </section>
  );
}

