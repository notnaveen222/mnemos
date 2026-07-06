"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// Opacity-only fade (no transform) so bold text stays crisp - animating
// `y`/transform on large bold text can cause subpixel color fringing.
const item: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
};

const STEPS = [
  {
    number: "01",
    title: "Connect mnemos to your AI",
    body: "Add it to Claude, ChatGPT, or anything else that speaks MCP.",
  },
  {
    number: "02",
    title: "Tell it something once",
    body: "\"Remember my flight is at 6pm.\" That's it - it's saved.",
  },
  {
    number: "03",
    title: "Ask any AI you're connected to",
    body: "Even a different one from the one you told. It already knows.",
  },
];

export default function LandingSection({ signedIn }: { signedIn: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<"hero" | "steps">("hero");

  const continueWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const goToDashboard = () => router.push("/dashboard");

  return (
    <div className="relative min-h-screen w-full bg-black">
      <button
        onClick={() => setView(view === "hero" ? "steps" : "hero")}
        className="font-[family-name:var(--font-jakarta)] fixed top-6 right-6 sm:top-8 sm:right-10 text-sm font-medium text-white hover:text-gray-300 transition-colors duration-200 cursor-pointer z-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          {view === "hero" ? (
            <motion.span
              key="how"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              How it works
            </motion.span>
          ) : (
            <motion.span
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-2"
            >
              <span>←</span>
              <span>Back</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <main className="min-h-screen w-full flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {view === "hero" ? (
            <motion.div
              key="hero"
              variants={reduceMotion ? undefined : container}
              initial={reduceMotion ? undefined : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              exit="exit"
              className="flex flex-col items-center text-center max-w-5xl gap-4"
            >
              <motion.h1
                variants={item}
                className="font-[family-name:var(--font-jakarta)] font-bold text-4xl sm:text-6xl lg:text-4xl leading-tight text-white whitespace-nowrap cursor-default"
              >
                Remember once
              </motion.h1>
              <motion.h1
                variants={item}
                className="font-[family-name:var(--font-instrument)] italic font-normal text-4xl sm:text-6xl lg:text-7xl  leading-tight text-white whitespace-nowrap -mt-3 cursor-default"
              >
                Recall everywhere.
              </motion.h1>

              <motion.p
                variants={item}
                className="font-[family-name:var(--font-jakarta)] text-white/80 text-base sm:text-lg mt-2 max-w-lg cursor-default"
              >
                mnemos keeps what you tell one AI and hands it to the next.
                Claude today, anything tomorrow.
              </motion.p>

              <motion.button
                variants={item}
                onClick={signedIn ? goToDashboard : continueWithGoogle}
                className="font-[family-name:var(--font-jakarta)] mt-1 rounded-full bg-white px-6 py-2.5 font-semibold text-black hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
              >
                {signedIn ? "Go to dashboard" : "Continue with Google"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="steps"
              variants={reduceMotion ? undefined : container}
              initial={reduceMotion ? undefined : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              exit="exit"
              className="flex flex-col items-center text-center max-w-lg gap-8 w-full"
            >
              <motion.h2
                variants={item}
                className="font-[family-name:var(--font-jakarta)] font-bold text-2xl sm:text-3xl text-white"
              >
                How it works
              </motion.h2>

              <div className="flex flex-col gap-6 w-full text-left">
                {STEPS.map((step) => (
                  <motion.div
                    key={step.number}
                    variants={item}
                    className="flex gap-4"
                  >
                    <span className="font-[family-name:var(--font-instrument)] italic text-2xl text-gray-500 shrink-0">
                      {step.number}
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-jakarta)] font-semibold text-white">
                        {step.title}
                      </p>
                      <p className="font-[family-name:var(--font-jakarta)] text-gray-400 text-sm mt-1">
                        {step.body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <p className="font-[family-name:var(--font-instrument)] italic tracking-wide fixed bottom-10 left-0 right-0 text-center text-lg text-gray-400 cursor-default">
        Named for{" "}
        <a
          href="https://en.wikipedia.org/wiki/Mnemosyne"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-4 hover:text-white transition-colors duration-200 cursor-pointer"
        >
          Mnemosyne
        </a>
        , the Titaness who forgot nothing.
      </p>
    </div>
  );
}
