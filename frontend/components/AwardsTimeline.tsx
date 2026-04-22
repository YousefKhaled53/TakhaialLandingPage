"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Milestone = {
  year: string;
  title: string;
  body: string;
  tag: string;
};

const milestones: Milestone[] = [
  {
    year: "2015",
    title: "Foundation & Pioneering",
    body: "While research and development began in 2014, the company was officially established in the UK in 2015 under the name General Senses. It was one of the first pioneers to introduce Virtual Reality (VR) and Augmented Reality (AR) applications for the B2B sector in the Middle East.",
    tag: "General Senses",
  },
  {
    year: "2017-2018",
    title: "Global Recognition",
    body: "The company gained significant international recognition after winning the 'Seedstars' award for the Best Startup in Kuwait in 2017. Following this success, it was selected to represent Kuwait at the Seedstars World Summit in Switzerland in April 2018, competing against top global startups. Later in 2018, the company was also officially established in Kuwait.",
    tag: "Seedstars Award",
  },
  {
    year: "2019",
    title: "Expansion and International Adoption",
    body: "This year marked major international expansion, as the company successfully exported its unique digital technology to European countries like France and Belgium. Tier-1 global brands, such as the 'Jumeirah' group and 'Lexus,' began deploying its technology. Notably, the company launched the very first VR Showroom in the MENA region for Lexus Kuwait.",
    tag: "Remarkable Milestone",
  },
  {
    year: "2023",
    title: "AI Evolution",
    body: "The company expanded its vision by strongly entering the Artificial Intelligence (AI) space, aiming to converge AI with Extended Reality (XR) to create unprecedented solutions. To achieve this, it established a Deep-Tech R&D division comprising an elite team of PhD and Masters-level researchers and engineers from leading institutions.",
    tag: "Deep-Tech R&D",
  },
  {
    year: "Present",
    title: "The Transformation to Takhaial",
    body: "Celebrating its 10-year anniversary, the company underwent a strategic rebranding to become 'Takhaial' (which means 'Imagine' in Arabic), a name chosen to reflect its regional roots and future-focused vision. Throughout this transition, the company successfully retained all of its intellectual property, source codes, and its advanced technical team.",
    tag: "Takhaial",
  },
  
];

export default function AwardsTimeline() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-32">
      <Header />

      <div className="relative mt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent md:block" />

        <ol className="flex flex-col gap-10 md:gap-16">
          {milestones.map((m, i) => (
            <TimelineItem key={m.year} milestone={m} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Header() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="eyebrow">Chapter 01</span>
      <h2 className="text-balance text-4xl font-light tracking-tight text-white sm:text-5xl md:text-6xl">
        Awards
        <span className="text-neon-red">.</span>
        <span className="ml-3 text-white/50">Timeline</span>
      </h2>
      <p className="max-w-xl text-sm font-light text-white/50">
        Five years of engineering discipline, measured by what the world chose
        to recognize.
      </p>
    </div>
  );
}

function TimelineItem({ milestone, index }: { milestone: Milestone; index: number }) {
  const [hovered, setHovered] = useState(false);
  const isLeft = index % 2 === 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      className={`relative grid grid-cols-1 items-center md:grid-cols-2 md:gap-16 ${
        isLeft ? "" : "md:[&>*:first-child]:order-2"
      }`}
    >
      <div className={`flex ${isLeft ? "md:justify-end" : "md:justify-start"}`}>
        <motion.div
          layout
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          transition={{ layout: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }}
          className="glass group relative w-full max-w-md cursor-pointer overflow-hidden rounded-3xl p-6"
        >
          <motion.div layout="position" className="flex items-center justify-between">
            <span className="eyebrow text-violet-glow">{milestone.tag}</span>
            <span className="font-mono text-xs text-white/40">{milestone.year}</span>
          </motion.div>
          <motion.h3
            layout="position"
            className="mt-4 text-xl font-light text-white md:text-2xl"
          >
            {milestone.title}
          </motion.h3>
          <motion.p layout="position" className="mt-2 text-sm leading-relaxed text-white/55">
            {milestone.body}
          </motion.p>

          <AnimatePresence initial={false}>
            {hovered && (
              <motion.div
                key="photo"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-accent/40 via-ink-700 to-neon-red/30">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
                  <div className="absolute bottom-3 left-3 text-[10px] tracking-wide text-white/70">
                    Award photograph · placeholder
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Timeline dot */}
      <div className="pointer-events-none absolute left-1/2 top-6 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-violet-glow shadow-[0_0_16px_4px_rgba(138,107,255,0.6)] md:block" />

      <div
        className={`hidden text-sm text-white/35 md:block ${
          isLeft ? "md:pl-6 md:text-left" : "md:pr-6 md:text-right"
        }`}
      >
        <span className="font-mono text-xs tracking-widest">{`0${index + 1}`}</span>
      </div>
    </motion.li>
  );
}
