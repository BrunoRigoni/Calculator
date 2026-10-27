import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthLabel, shiftMonth } from "@/lib/finance";

export function MonthPicker({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(shiftMonth(value, -1))} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <span className="min-w-[9.5rem] text-center text-sm font-medium">{monthLabel(value)}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(shiftMonth(value, 1))} aria-label="Próximo mês">
        <ChevronRight />
      </Button>
    </div>
  );
}
