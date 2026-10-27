import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

/** Lista em cartão com linhas responsivas — funciona bem do celular ao desktop. */
export function ListCard({ children }: { children: ReactNode }) {
  return <Card className="divide-y overflow-hidden">{children}</Card>;
}

export function ListRow({ leading, title, subtitle, trailing, actions }: { leading?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
      {actions}
    </div>
  );
}
