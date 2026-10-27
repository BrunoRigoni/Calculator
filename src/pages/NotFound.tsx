import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Página não encontrada"
      description="O endereço acessado não existe."
      action={
        <Button asChild>
          <Link to="/">Voltar ao painel</Link>
        </Button>
      }
    />
  );
}
