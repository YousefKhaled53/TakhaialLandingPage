"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";

type Industry = {
  name: string;
  subtitle: string;
  body: string;
  gradient: string;
};

const industries: Industry[] = [
  {
    name: "Healthcare",
    subtitle: "Spatial diagnostics & training",
    body: "From surgical pre-visualization to AI-assisted rehab — clinical-grade deployments on medical-grade hardware.",
    gradient: "from-[#1a1a4a] via-[#3a1a66] to-[#FF3366]",
  },
  {
    name: "Defense",
    subtitle: "Perception at the edge",
    body: "Aegis-powered situational awareness systems, ruggedized for operational theatres.",
    gradient: "from-[#0a1a2e] via-[#1a3a5a] to-[#6B4CE6]",
  },
  {
    name: "Retail",
    subtitle: "Immersive commerce",
    body: "Virtual try-on, in-store spatial analytics, and AI stylists that live inside the garment.",
    gradient: "from-[#2a0a3a] via-[#FF3366] to-[#FFB547]",
  },
  {
    name: "Education",
    subtitle: "Volumetric learning",
    body: "Textbooks replaced by walkable reconstructions of history, biology, and the cosmos.",
    gradient: "from-[#0a2a3a] via-[#4ECDC4] to-[#6B4CE6]",
  },
  {
    name: "Media & Entertainment",
    subtitle: "Directors of the dome",
    body: "360-VR cinematography and volumetric capture for the next era of storytelling.",
    gradient: "from-[#3a0a3a] via-[#8A6BFF] to-[#FF3366]",
  },
  {
    name: "Real Estate",
    subtitle: "Spatial twins",
    body: "Photoreal twins that buyers walk through from anywhere on Earth.",
    gradient: "from-[#0a1a1a] via-[#2a3a4a] to-[#8A6BFF]",
  },
];

export default function IndustriesCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      if (!trackRef.current || !containerRef.current) return;
      setDragWidth(
        Math.max(0, trackRef.current.scrollWidth - containerRef.current.clientWidth)
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-end justify-between gap-6"
        >
          <div className="flex flex-col gap-3">
            <span className="eyebrow">Chapter 04</span>
            <h2 className="text-balance text-4xl font-light tracking-tight text-white sm:text-5xl">
              Industries we move
              <span className="text-neon-red">.</span>
            </h2>
          </div>
          <p className="hidden max-w-sm text-sm font-light text-white/50 md:block">
            Drag horizontally. Every vertical is a proof of how spatial intelligence
            scales.
          </p>
        </motion.div>
      </div>

      <div
        ref={containerRef}
        className="mt-14 overflow-hidden px-6 md:px-12"
      >
        <motion.div
          ref={trackRef}
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -dragWidth, right: 0 }}
          dragElastic={0.08}
          className="flex cursor-grab gap-6 active:cursor-grabbing"
        >
          {industries.map((i, idx) => (
            <IndustryCard key={i.name} industry={i} index={idx} />
          ))}
        </motion.div>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl items-center gap-3 px-6 text-[10px] tracking-widest text-white/40">
        <span className="h-[1px] w-10 bg-white/15" />
        DRAG TO EXPLORE
      </div>
    </section>
  );
}

function IndustryCard({ industry, index }: { industry: Industry; index: number }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="glass relative flex h-[440px] w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl p-6 md:w-[380px]"
    >
      {/* Background image placeholder + gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-90`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/30 to-transparent" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="eyebrow text-white/75">Industry 0{index + 1}</span>
        <span className="font-mono text-[10px] text-white/60">TKH · IND</span>
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <h3 className="text-3xl font-light leading-tight text-white md:text-4xl">
          {industry.name}
          <span className="text-neon-red">.</span>
        </h3>
        <p className="text-sm text-white/75">{industry.subtitle}</p>
        <p className="text-xs leading-relaxed text-white/65">{industry.body}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
          Explore use cases <span>→</span>
        </div>
      </div>
    </motion.div>
  );
}
