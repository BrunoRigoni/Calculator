import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "income" | "expense" | "invest" | "neutral";
  hint?: string;
}

const tones = {
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
  invest: "bg-invest/10 text-invest",
  neutral: "bg-primary/10 text-primary",
};

export function StatCard({ label, value, icon: Icon, tone = "neutral", hint }: Props) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={cn("rounded-lg p-2", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 truncate text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
