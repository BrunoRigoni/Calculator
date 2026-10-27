import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Pencil, Plus, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/ConfirmDelete";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDialog, type Field } from "@/components/shared/FormDialog";
import { MonthPicker } from "@/components/shared/MonthPicker";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreate, useList, useRemove, useUpdate } from "@/hooks/use-data";
import { useCrudState } from "@/hooks/use-crud-state";
import { doMes, formatBRL, monthKey, today } from "@/lib/finance";
import type { Cartao, Insert } from "@/lib/types";

const PRESETS = ["#820ad1", "#ec7000", "#cc092f", "#0033a0", "#00a868", "#111827"];

const fields: Field[] = [
  { name: "nome", label: "Nome do cartão", type: "text", required: true, full: true, placeholder: "Ex.: Nubank, Itaú Platinum" },
  { name: "cor", label: "Cor do banco", type: "color", full: true, presets: PRESETS },
];

export default function Cartoes() {
  const [mes, setMes] = useState(monthKey(today()));
  const { data = [] } = useList("cartoes");
  const { data: transacoes = [] } = useList("transacoes");
  const create = useCreate("cartoes");
  const update = useUpdate("cartoes");
  const remove = useRemove("cartoes");
  const crud = useCrudState<Cartao>();

  const doMesAtual = doMes(transacoes, mes);
  const novo = (
    <Button onClick={crud.openNew}>
      <Plus /> Novo cartão
    </Button>
  );

  return (
    <>
      <PageHeader title="Cartões" description="Cadastre seus cartões e acompanhe o gasto de cada um no mês." actions={novo} />
      {data.length > 0 && (
        <div className="mb-4">
          <MonthPicker value={mes} onChange={setMes} />
        </div>
      )}
      {data.length === 0 ? (
        <EmptyState icon={CreditCard} title="Nenhum cartão cadastrado" description="Basta informar o nome e a cor do banco." action={novo} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => {
            const gastos = doMesAtual.filter((t) => t.cartao_id === c.id && t.tipo === "saida");
            const total = gastos.reduce((s, t) => s + Number(t.valor), 0);
            return (
              <div
                key={c.id}
                className="group relative flex aspect-[1.6] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${c.cor} 0%, ${c.cor}cc 55%, #0f172a 140%)` }}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                <div className="flex items-start justify-between">
                  <p className="text-lg font-semibold drop-shadow">{c.nome}</p>
                  <div className="flex gap-1">
                    <button onClick={() => crud.openEdit(c)} className="rounded-md bg-black/20 p-1.5 hover:bg-black/40" aria-label="Editar cartão">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => crud.askDelete(c)} className="rounded-md bg-black/20 p-1.5 hover:bg-black/40" aria-label="Excluir cartão">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-80">
                  <div className="h-7 w-10 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500" />
                  <Wifi className="h-5 w-5 rotate-90" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80">Gasto no mês</p>
                    <p className="text-2xl font-bold tabular-nums drop-shadow">{formatBRL(total)}</p>
                  </div>
                  <Link to={`/lancamentos?cartao=${c.id}&mes=${mes}`} className="rounded-md bg-black/20 px-2.5 py-1 text-xs font-medium hover:bg-black/40">
                    {gastos.length} lançamento(s)
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Editar cartão" : "Novo cartão"}
        fields={fields}
        initial={crud.editing ?? { nome: "", cor: PRESETS[0] }}
        onSubmit={async (v) => {
          const data = v as unknown as Insert<"cartoes">;
          if (crud.editing) await update.mutateAsync({ id: crud.editing.id, data });
          else await create.mutateAsync(data);
          toast.success("Cartão salvo");
        }}
      />
      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title={`Excluir o cartão ${crud.deleting?.nome}?`}
        description="Os lançamentos feitos com ele continuarão existindo."
        onConfirm={() => crud.deleting && remove.mutate(crud.deleting.id)}
      />
    </>
  );
}
