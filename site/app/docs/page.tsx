import type { Metadata } from "next";
import DocsContent from "@/components/DocsContent";

export const metadata: Metadata = {
  title: "Docs",
  description: "Tools mnemos exposes over MCP.",
};

export default function Docs() {
  return <DocsContent />;
}
