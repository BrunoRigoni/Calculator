import { cn } from "@/lib/utils";

export function ColorDot({ color, className }: { color?: string | null; className?: string }) {
  return <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)} style={{ background: color ?? "#94a3b8" }} />;
}
