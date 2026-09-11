export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    draft: "Rascunho",
  };
  return map[status] || status;
}

export function getStatusBadgeClasses(status: string): string {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    inactive: "bg-slate-100 text-slate-500",
    draft: "bg-amber-50 text-amber-700",
  };
  return map[status] || "bg-slate-100 text-slate-500";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
