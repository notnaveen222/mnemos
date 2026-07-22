import CopyButton from "@/components/CopyButton";

// A translucent (but not blurred) pill showing the MCP server URL with a
// copy button. Used on the landing hero.
export default function McpConnect({
  mcpUrl,
  label = "Add this MCP server to Claude",
  className = "",
}: {
  mcpUrl: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex w-fit max-w-full flex-col items-center ${className}`}>
      <p className="font-[family-name:var(--font-jakarta)] text-center text-xs text-white/40 mb-1.5">
        {label}
      </p>
      <div className="flex w-full items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2">
        <code className="whitespace-nowrap font-mono text-xs sm:text-sm text-white/80">
          {mcpUrl}
        </code>
        <CopyButton text={mcpUrl} />
      </div>
    </div>
  );
}
