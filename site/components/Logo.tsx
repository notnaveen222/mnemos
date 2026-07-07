"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function Logo() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
      className="fixed top-6 left-6 sm:top-8 sm:left-10 z-20 flex h-7 items-center"
    >
      <Link
        href="/"
        className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-white"
      >
        mnemos
      </Link>
    </motion.div>
  );
}
