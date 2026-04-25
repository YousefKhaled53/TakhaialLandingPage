"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type GatekeeperProps = {
  onEnter: () => void;
};

type Action = null | "yes" | "no";

export default function Gatekeeper({ onEnter }: GatekeeperProps) {
  const [action, setAction] = useState<Action>(null);
  const [noPhase, setNoPhase] = useState<"idle" | "closing" | "done">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleYes = () => {
    setAction("yes");
  };

  const handleNo = () => {
    setAction("no");
    setNoPhase("closing");
    const vid = videoRef.current;
    if (vid) vid.pause();
  };


  // Fires after the black-curtain fade completes, then redirects
  const handleNoAnimationComplete = () => {
    if (noPhase === "closing") {
      setNoPhase("done");
      window.location.href = "https://www.google.com";
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* ── Video background with zoom-in on "Yes" ── */}
      <motion.div
        className="absolute inset-0"
        animate={action === "yes" ? { scale: 8 } : { scale: 1 }}
        transition={action === "yes" ? { duration: 0.55, ease: [0.4, 0, 1, 1] } : {}}
        onAnimationComplete={() => { if (action === "yes") onEnter(); }}
      >
        <video
          ref={videoRef}
          src="/Digital_Eye_Animation_Generated.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* Dark overlay — deepens the scene */}
      <div className="pointer-events-none absolute inset-0 bg-black/40" />

      {/* Radial vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_65%,rgba(0,0,0,0.92)_100%)]" />

      {/* ── "No" black curtain closing from top & bottom ── */}
      <AnimatePresence>
        {noPhase === "closing" && (
          <>
            <motion.div
              key="curtain-top"
              className="absolute inset-x-0 top-0 z-40 bg-black"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              style={{ height: "50%", transformOrigin: "top" }}
            />
            <motion.div
              key="curtain-bottom"
              className="absolute inset-x-0 bottom-0 z-40 bg-black"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              style={{ height: "50%", transformOrigin: "bottom" }}
            />
            {/* Final fade overlay — triggers redirect on complete */}
            <motion.div
              key="curtain-fade"
              className="absolute inset-0 z-50 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45, ease: "easeIn" }}
              onAnimationComplete={handleNoAnimationComplete}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── CTA prompt ── */}
      <AnimatePresence>
        {action === null && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.4 } }}
            transition={{ duration: 1.1, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-x-0 bottom-[9%] z-10 flex flex-col items-center gap-8 px-6 text-center"
          >
            <h1 className="text-balance text-3xl font-bold tracking-wide text-white sm:text-4xl md:text-5xl">
              Are you ready for the future
              <span className="text-red-500">?</span>
            </h1>

            <div className="flex items-center gap-4">
              <GateButton variant="primary" onClick={handleYes}>
                Yes
              </GateButton>
              <GateButton variant="ghost" onClick={handleNo}>
                No
              </GateButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purple bloom on "Yes" */}
      {action === "yes" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.3 }}
          className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(107,76,230,0.5)_0%,transparent_60%)]"
        />
      )}
    </div>
  );
}

function GateButton({
  variant,
  onClick,
  children,
}: {
  variant: "primary" | "ghost";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base =
    "group relative min-w-[140px] rounded-full px-8 py-3 text-sm font-semibold tracking-wide transition-all duration-300 " +
    "backdrop-blur-md border border-white/20 bg-white/10 hover:bg-white/20";

  const variants =
    variant === "primary"
      ? "text-white shadow-[0_0_24px_rgba(107,76,230,0.25)] hover:shadow-[0_0_48px_rgba(107,76,230,0.45)] hover:border-white/40"
      : "text-white/80 hover:text-white hover:border-white/40";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className={`${base} ${variants}`}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/25 to-red-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
    </motion.button>
  );
}
