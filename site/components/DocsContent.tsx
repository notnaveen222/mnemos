"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

type Param = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
};

type Tool = {
  name: string;
  description: string;
  params: Param[];
  returns: string;
};

const TOOLS: Tool[] = [
  {
    name: "remember",
    description:
      "Save a fact to the user's persistent memory so it can be recalled later.",
    params: [
      {
        name: "content",
        type: "str",
        required: true,
        description: "The fact to save.",
      },
      {
        name: "tags",
        type: "list[str]",
        required: false,
        default: "None",
        description:
          'Optional tags for scoped recall later, e.g. ["work", "urgent"].',
      },
    ],
    returns: "Confirmation string containing the new memory's id.",
  },
  {
    name: "recall",
    description:
      "Search the user's saved memories for anything relevant to the query and return the matches.",
    params: [
      {
        name: "query",
        type: "str",
        required: true,
        description: "Words to search for across saved memories.",
      },
      {
        name: "tag",
        type: "str",
        required: false,
        default: "None",
        description: "Limit the search to memories saved under this tag.",
      },
    ],
    returns: "A list of matching memories, or a message if none are found.",
  },
  {
    name: "recall_by_time",
    description: "Find memories saved around a specific point in time.",
    params: [
      {
        name: "around_iso",
        type: "str",
        required: true,
        description:
          'ISO 8601 timestamp to search around, e.g. "2026-07-06T14:00:00".',
      },
      {
        name: "window_minutes",
        type: "int",
        required: false,
        default: "60",
        description: "How far before/after around_iso to search.",
      },
    ],
    returns: "Memories saved within the time window, ordered by time.",
  },
  {
    name: "recall_semantic",
    description:
      "Search the user's saved memories by meaning rather than exact keywords.",
    params: [
      {
        name: "query",
        type: "str",
        required: true,
        description:
          'A concept or description to match by meaning, e.g. "furry friend" can find a memory about "my cat".',
      },
    ],
    returns: "Memories ranked by semantic similarity to the query.",
  },
  {
    name: "forget",
    description: "Delete a saved memory by its id.",
    params: [
      {
        name: "memory_id",
        type: "str",
        required: true,
        description: "The id of the memory to delete. Use recall first to find it.",
      },
    ],
    returns: "Confirmation, or a message if no memory matched the id.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DocsContent() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen w-full px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <motion.div
          variants={fadeUp}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
        >
          <Link
            href="/"
            className="font-[family-name:var(--font-jakarta)] inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors duration-200"
          >
            <span>&larr;</span>
            <span>mnemos</span>
          </Link>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          className="font-[family-name:var(--font-jakarta)] font-bold text-3xl sm:text-4xl text-white mt-6"
        >
          Tools
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          className="font-[family-name:var(--font-jakarta)] text-white/60 text-sm sm:text-base mt-3 max-w-lg"
        >
          Everything mnemos currently exposes over MCP. Connect any MCP client
          to the server and these are the tools it can call.
        </motion.p>

        <motion.nav
          variants={fadeUp}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-y border-white/10 py-4"
        >
          {TOOLS.map((tool) => (
            <a
              key={tool.name}
              href={`#${tool.name}`}
              className="font-[family-name:var(--font-jakarta)] font-medium text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              {tool.name}
            </a>
          ))}
        </motion.nav>

        <div className="mt-4 flex flex-col divide-y divide-white/10">
          {TOOLS.map((tool) => (
            <motion.section
              key={tool.name}
              id={tool.name}
              className="py-10 scroll-mt-20"
              variants={fadeUp}
              initial={reduceMotion ? undefined : "hidden"}
              animate={reduceMotion ? undefined : "show"}
            >
              <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-xl sm:text-2xl text-white">
                {tool.name}
              </h2>
              <p className="font-[family-name:var(--font-jakarta)] text-gray-400 text-sm sm:text-base mt-2 leading-relaxed max-w-lg">
                {tool.description}
              </p>

              <h3 className="font-[family-name:var(--font-jakarta)] font-medium text-xs uppercase tracking-wide text-white/40 mt-6">
                Parameters
              </h3>
              <div className="mt-3 flex flex-col gap-4">
                {tool.params.map((param) => (
                  <div key={param.name}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-[family-name:var(--font-jakarta)] font-medium text-sm text-white">
                        {param.name}
                      </span>
                      <span className="font-[family-name:var(--font-jakarta)] text-xs text-gray-500">
                        {param.type}
                      </span>
                      <span className="font-[family-name:var(--font-jakarta)] text-xs text-gray-500">
                        {param.required
                          ? "required"
                          : `optional, default ${param.default}`}
                      </span>
                    </div>
                    <p className="font-[family-name:var(--font-jakarta)] text-gray-400 text-sm mt-1 leading-relaxed">
                      {param.description}
                    </p>
                  </div>
                ))}
              </div>

              <h3 className="font-[family-name:var(--font-jakarta)] font-medium text-xs uppercase tracking-wide text-white/40 mt-6">
                Returns
              </h3>
              <p className="font-[family-name:var(--font-jakarta)] text-gray-400 text-sm mt-2 leading-relaxed max-w-lg">
                {tool.returns}
              </p>
            </motion.section>
          ))}
        </div>
      </div>
    </main>
  );
}
