"use client";

import { motion } from "framer-motion";

const services = [
  {
    title: "Spatial Computing",
    body: "Room-scale perception, SLAM, and scene understanding for the next generation of XR hardware.",
    icon: "◐",
  },
  {
    title: "Applied AI",
    body: "Multi-modal models — vision, speech, language — composed into agents that reason inside 3D space.",
    icon: "◇",
  },
  {
    title: "Volumetric Capture",
    body: "Photoreal humans, objects, and environments captured at cinematic fidelity.",
    icon: "◯",
  },
  {
    title: "Neural Rendering",
    body: "Real-time NeRF and Gaussian-splatting pipelines optimized for headsets and mobile GPUs.",
    icon: "◈",
  },
  {
    title: "XR Product Design",
    body: "Spatial UX that respects attention, ergonomics, and the physics of the room.",
    icon: "◒",
  },
  {
    title: "Enterprise Deployment",
    body: "From POC to fleet — private clouds, on-device inference, and mission-grade security.",
    icon: "◎",
  },
];

export default function ServicesOverview() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <span className="eyebrow">Chapter 02</span>
        <h2 className="text-balance text-4xl font-light tracking-tight text-white sm:text-5xl md:text-6xl">
          What we do
          <span className="text-neon-red">.</span>
        </h2>
        <p className="max-w-xl text-sm font-light text-white/50">
          Six capabilities, engineered to click together into a single deployable
          spatial intelligence platform.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
        }}
        className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {services.map((s) => (
          <motion.div
            key={s.title}
            variants={{
              hidden: { opacity: 0, y: 30 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] } },
            }}
            whileHover={{ y: -4 }}
            className="glass group relative flex flex-col gap-4 rounded-3xl p-8 transition-shadow hover:shadow-glow"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl text-violet-glow">{s.icon}</span>
              <span className="eyebrow text-white/35">Service</span>
            </div>
            <h3 className="text-xl font-light text-white">{s.title}</h3>
            <p className="text-sm leading-relaxed text-white/55">{s.body}</p>
            <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-white/40 transition-colors group-hover:text-white/70">
              Learn more
              <span>→</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
