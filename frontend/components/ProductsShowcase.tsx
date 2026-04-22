"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type Product = {
  name: string;
  tagline: string;
  body: string;
  accent: string;
  tint: string;
  image?: string;
};

const products: Product[] = [
  {
    name: "Closr",
    tagline: "AI Sales and Marketing",
    body: "An intelligent, omnichannel sales engine. It integrates deeply with 8 platforms (including WhatsApp, Instagram, Facebook, and websites), qualifies leads, processes complex multimedia documents, and communicates using text, voice notes, images, and videos.",
    accent: "#6B4CE6",
    tint: "from-violet-accent/80 via-violet-glow/30 to-transparent",
    image: "/products/closr.jpg",
  },
  {
    name: "Eikon",
    tagline: "Celebrity AI",
    body: "A digital twin cloning service that creates custom AI personas for celebrities and influencers. It allows brands to leverage the star power of ambassadors to send personalized, multilingual marketing messages and build emotional connections at an infinite scale.",
    accent: "#FF3366",
    tint: "from-neon-red/70 via-neon-red/20 to-transparent",
    image: "/products/eikon.jpeg",
  },
  {
    name: "Metis",
    tagline: "Training & Education AI",
    body: "An AI solution dedicated to digital learning, training, and education.Atlas (Field Intelligence AI): An AI product designed for in-field, real-time intelligence and assistance.",
    accent: "#8A6BFF",
    tint: "from-violet-glow/70 via-violet-accent/30 to-transparent",
    image: "/products/metis.png",
  },
  {
    name: "Atlas",
    tagline: "Field Intelligence AI",
    body: "An AI product designed for in-field, real-time intelligence and assistance.",
    accent: "#6B4CE6",
    tint: "from-violet-accent/70 via-white/10 to-transparent",
    image: "/products/atlas.png",
  },
  {
    name: "Lucid",
    tagline: "Virtual Reality",
    body: "Provides photo-realistic, uncompromised VR walkthroughs (such as real estate tours or virtual car showrooms). It is specially engineered to be completely dizziness-free and runs on portable, wireless headsets without the need for high-end PCs.",
    accent: "#8A6BFF",
    tint: "from-violet-glow/60 via-ink-700/30 to-transparent",
    image: "/products/lucid.jpg",
  },

  {
    name: "Vivid",
    tagline: "Augmented Reality",
    body: "Delivers interactive, portable AR applications that enhance the physical world. Use cases include fully interactive real estate maquettes and life-sized 3D vehicle configurators projected directly into the user's physical space.",
    accent: "#6B4CE6",
    tint: "from-violet-accent/60 via-neon-red/20 to-transparent",
    image: "/products/vivid.jpg",
  },
  {
    name: "Nexus",
    tagline: "Mixed Reality",
    body: "Creates immersive Mixed Reality portals where the digital world interacts intelligently with the user's physical environment.",
    accent: "#FF3366",
    tint: "from-neon-red/60 via-violet-glow/20 to-transparent",
    image: "/products/nexus.jpg",
  },
  {
    name: "Vizor",
    tagline: "Smart Glasses Extended Reality",
    body: "A service focused on Extended Reality delivered through Smart Glasses.",
    accent: "#FF3366",
    tint: "from-neon-red/60 via-violet-accent/20 to-transparent",
    image: "/products/vizor.jpg",
  },
];

export default function ProductsShowcase() {
  return (
    <section className="relative w-full overflow-hidden py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <span className="eyebrow">Chapter 03</span>
          <h2 className="text-balance text-4xl font-light tracking-tight text-white sm:text-5xl md:text-6xl">
            Eight products
            <span className="text-neon-red">.</span>{" "}
            <span className="text-white/50">One spatial OS</span>
          </h2>
          <p className="max-w-2xl text-sm font-light text-white/50">
            Each product is a layer. Stacked, they form the operating system for
            the spatial web.
          </p>
        </motion.div>
      </div>

      <div className="relative mt-24 flex flex-col">
        {products.map((p, i) => (
          <ProductRow key={p.name} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function ProductRow({ product, index }: { product: Product; index: number }) {
  const isImageLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9 }}
      className="relative"
    >
      {/* Diagonal divider */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
        style={{
          clipPath: isImageLeft
            ? "polygon(0 100%, 100% 0, 100% 100%)"
            : "polygon(0 0, 100% 100%, 0 100%)",
          background: "linear-gradient(90deg, rgba(138,107,255,0.15), rgba(255,51,102,0.08))",
        }}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16 md:py-24">
        <div className={isImageLeft ? "md:order-1" : "md:order-2"}>
          <ProductVisual product={product} index={index} flip={!isImageLeft} />
        </div>

        <motion.div
          initial={{ opacity: 0, x: isImageLeft ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className={`flex flex-col gap-4 ${isImageLeft ? "md:order-2 md:pl-4" : "md:order-1 md:pr-4"}`}
        >
          <span className="eyebrow text-violet-glow">
            Product 0{index + 1}
          </span>
          <h3 className="text-balance text-4xl font-light leading-tight text-white md:text-5xl">
            {product.name}
            <span className="text-neon-red">.</span>
          </h3>
          <p className="text-lg font-light text-white/60">{product.tagline}</p>
          <p className="max-w-lg text-sm leading-relaxed text-white/55">
            {product.body}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button className="glass rounded-full px-5 py-2 text-xs tracking-wide text-white/80 transition hover:text-white">
              Explore
            </button>
            <span className="text-[10px] tracking-widest text-white/30">
              TAKHAIAL · {product.name.toUpperCase()}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ProductVisual({
  product,
  index,
  flip,
}: {
  product: Product;
  index: number;
  flip: boolean;
}) {
  const clip = flip
    ? "polygon(0 8%, 100% 0, 100% 92%, 0 100%)"
    : "polygon(0 0, 100% 8%, 100% 100%, 0 92%)";

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotate: flip ? -0.4 : 0.4 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative aspect-[4/3] w-full overflow-hidden"
      style={{ clipPath: clip }}
    >
      {/* Real product image when available */}
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${product.tint}`}
          style={{ backgroundColor: product.accent + "22" }}
        />
      )}

      {/* Overlay tint on top of real images to keep them on-brand */}
      {product.image && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${product.tint} opacity-60`}
        />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />

      {/* Diagonal accent stripe */}
      <div
        className="absolute -left-10 top-0 h-full w-2 rotate-[-12deg] opacity-80"
        style={{
          background: `linear-gradient(180deg, transparent, ${product.accent}, transparent)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-between p-8">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-white/70">0{index + 1} / 08</span>
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: product.accent, boxShadow: `0 0 12px ${product.accent}` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
