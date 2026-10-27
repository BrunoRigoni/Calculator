import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormDialog, type Field, type Values } from "@/components/shared/FormDialog";
import { useCreate, useList, useUpdate } from "@/hooks/use-data";
import { today } from "@/lib/finance";
import { FORMAS_PAGAMENTO, type Insert, type TipoMovimento, type Transacao } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: Transacao | null;
  tipo?: TipoMovimento;
  defaults?: Partial<Insert<"transacoes">>;
  onDelete?: (t: Transacao) => void;
}

/** Diálogo de criação/edição de entradas e saídas. */
export function TransacaoDialog({ open, onOpenChange, editing, tipo = "saida", defaults, onDelete }: Props) {
  const { data: categorias = [] } = useList("categorias");
  const { data: pessoas = [] } = useList("pessoas");
  const { data: cartoes = [] } = useList("cartoes");
  const create = useCreate("transacoes");
  const update = useUpdate("transacoes");

  const fields: Field[] = [
    {
      name: "tipo",
      label: "Tipo",
      type: "select",
      required: true,
      options: [
        { value: "entrada", label: "Entrada" },
        { value: "saida", label: "Saída" },
      ],
    },
    { name: "valor", label: "Valor", type: "money", required: true },
    { name: "descricao", label: "Descrição", type: "text", required: true, full: true, placeholder: "Ex.: Mercado, Salário de outubro" },
    { name: "data", label: "Data", type: "date", required: true },
    {
      name: "categoria_id",
      label: "Categoria",
      type: "select",
      options: [], // preenchido conforme o tipo, abaixo
    },
    {
      name: "pessoa_id",
      label: "Pessoa",
      type: "select",
      options: pessoas.map((p) => ({ value: p.id, label: p.nome, color: p.cor })),
    },
    { name: "forma", label: "Forma", type: "select", required: true, options: FORMAS_PAGAMENTO },
    {
      name: "cartao_id",
      label: "Cartão",
      type: "select",
      required: true,
      options: cartoes.map((c) => ({ value: c.id, label: c.nome, color: c.cor })),
      show: (v) => v.forma === "cartao",
      hint: cartoes.length === 0 ? "Cadastre um cartão na tela Cartões." : undefined,
    },
    { name: "confirmado", label: "Já foi pago / recebido", type: "switch", full: true },
    { name: "observacao", label: "Observação", type: "textarea" },
  ];

  // As categorias dependem do tipo selecionado.
  const withCategorias = (v: Values): Field[] =>
    fields.map((f) =>
      f.name === "categoria_id"
        ? { ...f, options: categorias.filter((c) => c.tipo === v.tipo).map((c) => ({ value: c.id, label: c.nome, color: c.cor })) }
        : f,
    );

  const initial: Values = editing
    ? { ...editing, confirmado: editing.status === "confirmado" }
    : {
        tipo,
        descricao: "",
        valor: "",
        data: today(),
        categoria_id: categorias.find((c) => c.tipo === tipo)?.id ?? "",
        pessoa_id: "",
        forma: "pix",
        cartao_id: "",
        confirmado: true,
        observacao: "",
        ...defaults,
      };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Editar lançamento" : tipo === "entrada" ? "Nova entrada" : "Nova saída"}
      fields={withCategorias}
      initial={initial}
      extra={
        editing && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive sm:hidden"
            onClick={() => {
              onOpenChange(false);
              onDelete(editing);
            }}
          >
            <Trash2 /> Excluir lançamento
          </Button>
        ) : undefined
      }
      derive={(v, changed) => {
        if (changed !== "tipo") return {};
        const cat = categorias.find((c) => c.id === v.categoria_id);
        return cat && cat.tipo !== v.tipo ? { categoria_id: categorias.find((c) => c.tipo === v.tipo)?.id ?? "" } : {};
      }}
      onSubmit={async (v) => {
        const { confirmado, ...rest } = v;
        const data = {
          boleto_id: null,
          contrato_id: null,
          cobranca_id: null,
          parcela: null,
          ...(editing ? {} : defaults),
          ...rest,
          status: confirmado ? "confirmado" : "pendente",
        } as Insert<"transacoes">;
        if (editing) await update.mutateAsync({ id: editing.id, data });
        else await create.mutateAsync(data);
        toast.success("Lançamento salvo");
      }}
    />
  );
}
