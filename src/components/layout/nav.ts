import {
  ArrowLeftRight,
  Banknote,
  Building2,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  Receipt,
  Tags,
  Users,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  /** Rótulo curto para a barra inferior do celular. */
  short?: string;
  icon: LucideIcon;
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Visão geral",
    items: [
      { to: "/", label: "Painel", icon: LayoutDashboard },
      { to: "/lancamentos", label: "Entradas e saídas", short: "Extrato", icon: ArrowLeftRight },
      { to: "/a-receber", label: "A receber", short: "Receber", icon: HandCoins },
    ],
  },
  {
    title: "Despesas",
    items: [
      { to: "/cartoes", label: "Cartões", icon: CreditCard },
      { to: "/boletos", label: "Boletos", icon: Receipt },
      { to: "/financiamentos", label: "Financiamentos", icon: Building2 },
      { to: "/emprestimos", label: "Empréstimos", icon: Banknote },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { to: "/pessoas", label: "Pessoas", icon: Users },
      { to: "/categorias", label: "Categorias", icon: Tags },
      { to: "/motivos", label: "Motivos", icon: Landmark },
    ],
  },
];

export const MOBILE_PRIMARY = ["/", "/lancamentos", "/a-receber", "/boletos"];
