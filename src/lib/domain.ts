export const modules = [
  {
    key: "requests",
    label: "Solicitações",
    singular: "solicitação",
    description: "Do primeiro contato à resolução, com cada passo registrado.",
  },
  {
    key: "services",
    label: "Serviços",
    singular: "serviço",
    description:
      "Organize a execução. Acompanhe responsáveis, prazos e evidências.",
  },
  {
    key: "announcements",
    label: "Comunicados",
    singular: "comunicado",
    description:
      "A informação certa, para as pessoas certas, com histórico verificável.",
  },
  {
    key: "documents",
    label: "Documentos",
    singular: "documento",
    description: "Atas, regimento e arquivos. Cada versão preservada.",
  },
  {
    key: "checklist_templates",
    label: "Modelos de checklist",
    singular: "modelo",
    description:
      "Defina as rotinas e gere uma execução independente para cada dia.",
  },
  {
    key: "checklist_runs",
    label: "Checklist diário",
    singular: "execução",
    description: "O que foi feito, por quem e em qual horário.",
  },
  {
    key: "units",
    label: "Unidades",
    singular: "unidade",
    description: "Uma visão organizada dos espaços e seus vínculos.",
  },
  {
    key: "blocks",
    label: "Blocos",
    singular: "bloco",
    description: "A estrutura do condomínio, sem complicação.",
  },
  {
    key: "people",
    label: "Pessoas",
    singular: "pessoa",
    description: "Proprietários, moradores e contatos autorizados.",
  },
  {
    key: "unit_memberships",
    label: "Vínculos",
    singular: "vínculo",
    description: "Relacione pessoas e unidades, com validação explícita.",
  },
] as const;
export type Kind = (typeof modules)[number]["key"];
export type Item = {
  id: string;
  condominium_id: string;
  kind: Kind;
  title: string;
  status: string;
  data: Record<string, unknown>;
  assigned_to: string | null;
  due_date: string | null;
  revision: number;
  file_revision: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};
export type Member = {
  user_id: string;
  display_name: string;
  role: "admin" | "manager" | "operator";
  permissions: string[];
  condominium_id: string;
};
export type Condo = {
  id: string;
  name: string;
  timezone: string;
  settings: Record<string, boolean>;
};
export type Approval = {
  id: string;
  record_id: string;
  revision: number;
  status: string;
  requested_by: string;
  decided_by: string | null;
  reason: string | null;
  created_at: string;
};
export const labels: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  waiting: "Aguardando informação",
  resolved: "Resolvida",
  cancelled: "Cancelado",
  todo: "A fazer",
  done: "Concluído",
  draft: "Rascunho",
  pending: "Aguardando aprovação",
  published: "Publicado",
  active: "Ativo",
  archived: "Arquivado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  superseded: "Substituída",
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
  all: "Todos",
  blocks: "Blocos",
  units: "Unidades",
  owner: "Proprietário",
  resident: "Morador",
  authorized: "Contato autorizado",
  admin: "Administrador",
  manager: "Síndico",
  operator: "Operador",
};
export function can(member: Member | undefined, permission: string) {
  return (
    !!member &&
    (member.permissions.includes("*") ||
      member.permissions.includes(permission))
  );
}
export function transitions(item: Item) {
  if (item.kind === "requests")
    return (
      (
        {
          open: ["in_progress", "cancelled"],
          in_progress: ["waiting", "resolved", "cancelled"],
          waiting: ["in_progress", "resolved", "cancelled"],
          resolved: ["in_progress"],
        } as Record<string, string[]>
      )[item.status] || []
    );
  if (item.kind === "services")
    return (
      (
        {
          todo: ["in_progress", "cancelled"],
          in_progress: ["done", "cancelled"],
          done: ["in_progress"],
        } as Record<string, string[]>
      )[item.status] || []
    );
  return [];
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function filterItems(
  items: Item[],
  kind: string,
  query: string,
  status: string,
  assigned: string,
  from: string,
  to: string,
  block: string,
) {
  return items.filter(
    (i) =>
      (!kind || i.kind === kind) &&
      (!query ||
        `${i.title} ${String(i.data.description ?? "")}`
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR"))) &&
      (!status || i.status === status) &&
      (!assigned || i.assigned_to === assigned) &&
      (!from || i.created_at.slice(0, 10) >= from) &&
      (!to || i.created_at.slice(0, 10) <= to) &&
      (!block ||
        i.data.block_id === block ||
        items.some(
          (u) => u.id === i.data.unit_id && u.data.block_id === block,
        )),
  );
}
export function dateLabel(s: string | undefined | null, time = false) {
  if (!s) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(time ? { timeStyle: "short" } : {}),
  }).format(new Date(s.length === 10 ? s + "T12:00:00" : s));
}
export function text(data: Record<string, unknown>, key: string) {
  return typeof data[key] === "string" ? (data[key] as string) : "";
}

export function dailySeries(
  items: Item[],
  today: string,
  timeZone = "America/Fortaleza",
) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const counts = new Map<string, number>();
  for (const item of items)
    if (item.kind === "requests") {
      const key = formatter.format(new Date(item.created_at));
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today + "T12:00:00Z");
    day.setUTCDate(day.getUTCDate() - 6 + index);
    const key = day.toISOString().slice(0, 10);
    return { key, count: counts.get(key) || 0 };
  });
}
