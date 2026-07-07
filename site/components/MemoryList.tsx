"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

type Memory = {
  id: string;
  content: string;
  tags: string[] | null;
  created_at: string;
};

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default function MemoryList({
  initialMemories,
  userId,
}: {
  initialMemories: Memory[];
  userId: string;
}) {
  const supabase = createClient();
  const reduceMotion = useReducedMotion();
  const [memories, setMemories] = useState(initialMemories);
  const [pendingDelete, setPendingDelete] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", pendingDelete.id)
      .eq("user_id", userId);
    setDeleting(false);
    if (!error) {
      setMemories((prev) => prev.filter((m) => m.id !== pendingDelete.id));
    }
    setPendingDelete(null);
  };

  return (
    <>
      <motion.ul
        className="flex flex-col"
        variants={reduceMotion ? undefined : container}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
      >
        {memories.map((memory) => (
          <motion.li
            key={memory.id}
            variants={item}
            className="font-[family-name:var(--font-jakarta)] border-b border-white/10 py-5 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-white">{memory.content}</p>
              <button
                onClick={() => setPendingDelete(memory)}
                aria-label="Delete mneme"
                className="shrink-0 text-gray-500 hover:text-red-500 transition-colors duration-200 cursor-pointer"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span>{new Date(memory.created_at).toLocaleString()}</span>
              {memory.tags?.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => !deleting && setPendingDelete(null)}
            className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="font-[family-name:var(--font-jakarta)] w-full max-w-sm rounded-xl border border-white/10 bg-black p-6 text-center"
            >
              <p className="text-white text-base mb-6">Confirm delete this mneme?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setPendingDelete(null)}
                  disabled={deleting}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors duration-200 cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
