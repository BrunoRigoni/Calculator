import { lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGate } from "@/components/layout/AuthGate";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Lancamentos = lazy(() => import("@/pages/Lancamentos"));
const Cobrancas = lazy(() => import("@/pages/Cobrancas"));
const Cartoes = lazy(() => import("@/pages/Cartoes"));
const Boletos = lazy(() => import("@/pages/Boletos"));
const Contratos = lazy(() => import("@/pages/Contratos"));
const Pessoas = lazy(() => import("@/pages/Pessoas"));
const Categorias = lazy(() => import("@/pages/Categorias"));
const Motivos = lazy(() => import("@/pages/Motivos"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lancamentos" element={<Lancamentos />} />
              <Route path="/a-receber" element={<Cobrancas />} />
              <Route path="/cartoes" element={<Cartoes />} />
              <Route path="/boletos" element={<Boletos />} />
              <Route path="/financiamentos" element={<Contratos tipo="financiamento" />} />
              <Route path="/emprestimos" element={<Contratos tipo="emprestimo" />} />
              <Route path="/pessoas" element={<Pessoas />} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/motivos" element={<Motivos />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </QueryClientProvider>
  );
}
