"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function DashboardHeading() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-baseline gap-2 mb-3"
    >
      <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">
        Your Mnemes
      </h1>
      <span className="font-[family-name:var(--font-jakarta)] text-sm text-white/40">
        (n.) memory
      </span>
    </motion.div>
  );
}
