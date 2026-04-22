"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Gatekeeper from "@/components/Gatekeeper";
import SpaceBackground from "@/components/SpaceBackground";
import Hero from "@/components/Hero";
import AwardsTimeline from "@/components/AwardsTimeline";
import ServicesOverview from "@/components/ServicesOverview";
import ProductsShowcase from "@/components/ProductsShowcase";
import LogoMarquee from "@/components/LogoMarquee";
import IndustriesCarousel from "@/components/IndustriesCarousel";
import ContactFooter from "@/components/ContactFooter";
import ChatAgentFab from "@/components/ChatAgentFab";

type Stage = "gate" | "enter";

export default function Page() {
  const [stage, setStage] = useState<Stage>("gate");

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-ink-900">
      <AnimatePresence mode="wait">
        {stage === "gate" && (
          <motion.div
            key="gate"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(30px)" }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-0 z-[60]"
          >
            <Gatekeeper onEnter={() => setStage("enter")} />
          </motion.div>
        )}
      </AnimatePresence>

      {stage === "enter" && (
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
          className="relative z-10"
        >
          <SpaceBackground />
          <div className="relative z-10">
            <Hero />
            <AwardsTimeline />
            <ServicesOverview />
            <ProductsShowcase />
            <LogoMarquee />
            <IndustriesCarousel />
            <ContactFooter />
          </div>
          <ChatAgentFab />
        </motion.div>
      )}
    </main>
  );
}
