"use client";

import { motion } from "framer-motion";

type Brand = { name: string; color: string };

const brands: Brand[] = [
  { name: "Lexus", color: "#FF3366" },
  { name: "Toyota", color: "#FFB547" },
  { name: "BMW", color: "#8A6BFF" },
  { name: "Jaguar", color: "#4ECDC4" },
  { name: "TMG", color: "#FF6B6B" },
  { name: "Emaar", color: "#6B4CE6" },
  { name: "Jumeirah", color: "#F6E27F" },
  { name: "Kuwaiti Government", color: "#5AB0FF" },
  { name: "UAE Government", color: "#FF8FD6" },
  { name: "Kuwait Petroleum Corporation", color: "#A0FF9F" },
];

export default function LogoMarquee() {
  const row = [...brands, ...brands];

  return (
    <section className="relative py-24">
      <div className="mx-auto mb-10 max-w-6xl px-6 text-center">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="eyebrow"
        >
          Trusted by teams building the spatial web
        </motion.span>
      </div>

      <div className="group relative mx-auto w-full overflow-hidden">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-900 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-900 to-transparent" />

        <div className="marquee-track flex w-max animate-marquee gap-14 px-8">
          {row.map((b, i) => (
            <Logo key={`${b.name}-${i}`} brand={b} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Logo({ brand }: { brand: Brand }) {
  return (
    <div className="group/logo flex h-16 min-w-[180px] items-center justify-center">
      <span
        className="logo-mono text-2xl font-semibold tracking-[0.25em]"
        style={
          // Expose brand color via CSS var; revealed on hover via filter toggle
          { color: brand.color } as React.CSSProperties
        }
      >
        {brand.name}
      </span>
    </div>
  );
}
