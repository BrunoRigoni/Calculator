import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/hooks/use-theme";

export function Toaster() {
  const { theme } = useTheme();
  return <Sonner theme={theme} richColors position="top-center" closeButton />;
}
