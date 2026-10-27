import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type Values = Record<string, unknown>;

export interface Option {
  value: string;
  label: string;
  color?: string;
}

export interface Field {
  name: string;
  label: string;
  type: "text" | "money" | "integer" | "date" | "select" | "color" | "textarea" | "switch";
  required?: boolean;
  placeholder?: string;
  options?: Option[];
  /** Ocupa a linha inteira no grid de 2 colunas. */
  full?: boolean;
  hint?: string;
  /** Cores sugeridas para campos do tipo "color". */
  presets?: string[];
  show?: (v: Values) => boolean;
}

const NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Lista fixa ou função dos valores atuais (para campos dependentes). */
  fields: Field[] | ((values: Values) => Field[]);
  initial: object;
  onSubmit: (values: Values) => Promise<unknown> | void;
  /** Recalcula campos dependentes quando um campo muda. */
  derive?: (values: Values, changed: string) => Values;
  submitLabel?: string;
  extra?: ReactNode;
}

export function FormDialog({ open, onOpenChange, title, description, fields, initial, onSubmit, derive, submitLabel = "Salvar", extra }: Props) {
  const [values, setValues] = useState<Values>(initial as Values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial as Values);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (name: string, value: unknown) =>
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      return derive ? { ...next, ...derive(next, name) } : next;
    });

  const allFields = typeof fields === "function" ? fields(values) : fields;
  const visible = allFields.filter((f) => !f.show || f.show(values));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    for (const f of visible) {
      const v = values[f.name];
      if (f.required && (v === undefined || v === null || v === "")) errs[f.name] = "Obrigatório";
      if ((f.type === "money" || f.type === "integer") && v !== "" && v !== null && v !== undefined) {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) errs[f.name] = "Valor inválido";
        if (f.type === "integer" && (!Number.isInteger(n) || n < 1)) errs[f.name] = "Informe um número inteiro ≥ 1";
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Normaliza: números como number, vazios como null, campos ocultos como null.
    const out: Values = { ...values };
    for (const f of allFields) {
      const hidden = !visible.includes(f);
      const v = out[f.name];
      if (f.type === "switch") out[f.name] = Boolean(v);
      else if (hidden || v === "" || v === undefined) out[f.name] = null;
      else if (f.type === "money" || f.type === "integer") out[f.name] = Number(v);
    }
    setSaving(true);
    try {
      await onSubmit(out);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((f) => (
              <div key={f.name} className={cn("grid gap-1.5", (f.full || f.type === "textarea") && "sm:col-span-2")}>
                {f.type !== "switch" && (
                  <Label htmlFor={f.name}>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                )}
                <FieldInput field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
                {errors[f.name] ? (
                  <p className="text-xs text-destructive">{errors[f.name]}</p>
                ) : (
                  f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>
                )}
              </div>
            ))}
          </div>
          {extra}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ field: f, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const str = value === null || value === undefined ? "" : String(value);
  switch (f.type) {
    case "textarea":
      return <Textarea id={f.name} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} rows={3} />;
    case "select":
      return (
        <Select value={str || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
          <SelectTrigger id={f.name} aria-label={f.label}>
            <SelectValue placeholder={f.placeholder ?? "Selecione"} />
          </SelectTrigger>
          <SelectContent>
            {!f.required && <SelectItem value={NONE}>— Nenhum —</SelectItem>}
            {f.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                <span className="flex items-center gap-2">
                  {o.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color }} />}
                  {o.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "color":
      return (
        <div className="flex items-center gap-3">
          <input
            id={f.name}
            type="color"
            value={str || "#10b981"}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 rounded-md border border-input bg-background p-1"
          />
          <Input value={str} onChange={(e) => onChange(e.target.value)} className="font-mono" maxLength={7} aria-label={`${f.label} (hex)`} />
          {f.presets && (
            <div className="flex shrink-0 gap-1">
              {f.presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(p)}
                  className={cn("h-6 w-6 rounded-full border-2", str === p ? "border-foreground" : "border-transparent")}
                  style={{ background: p }}
                  aria-label={`Usar cor ${p}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    case "switch":
      return (
        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch id={f.name} checked={Boolean(value)} onCheckedChange={onChange} />
          {f.label}
        </label>
      );
    case "money":
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input
            id={f.name}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="pl-10"
            value={str}
            placeholder="0,00"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "integer":
      return <Input id={f.name} type="number" inputMode="numeric" step="1" min="1" value={str} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <Input id={f.name} type="date" value={str} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <Input id={f.name} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}
