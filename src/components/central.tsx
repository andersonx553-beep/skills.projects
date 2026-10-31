"use client";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Megaphone,
  Files,
  ListChecks,
  Users,
  ShieldCheck,
  ChartNoAxesCombined,
  Settings,
  ChevronRight,
  Plus,
  Search,
  Menu,
  X,
  ArrowUpRight,
  RefreshCw,
  LogOut,
  Check,
  Clock,
  Paperclip,
  Download,
  ChevronLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  LockKeyhole,
  PanelsTopLeft,
} from "lucide-react";
import {
  modules,
  labels,
  can,
  transitions,
  dateLabel,
  filterItems,
  dailySeries,
  text,
  type Item,
  type Member,
  type Condo,
  type Approval,
  type Kind,
} from "@/lib/domain";
type State = {
  configured: boolean;
  user: { id: string; email: string } | null;
  condos: Condo[];
  selected?: string;
  memberships: Member[];
  members: Member[];
  records: Item[];
  approvals: Approval[];
  updatedAt?: string;
};
type Detail = {
  versions: {
    revision: number;
    snapshot: Item & { files?: Attachment[] };
    created_at: string;
  }[];
  messages: {
    id: string;
    body: string;
    visibility: string;
    created_by: string;
    created_at: string;
  }[];
  attachments: Attachment[];
  events: {
    id: string;
    actor_id: string;
    action: string;
    detail: Record<string, unknown>;
    created_at: string;
  }[];
  recipients: number;
  delivery: { event: string }[];
};
type Attachment = {
  id: string;
  name: string;
  revision: number;
  category: string;
  size: number;
};
const icons: Record<string, typeof Building2> = {
  dashboard: LayoutDashboard,
  requests: ClipboardList,
  services: Wrench,
  announcements: Megaphone,
  documents: Files,
  checklist_templates: ListChecks,
  checklist_runs: CheckCircle2,
  units: Building2,
  blocks: PanelsTopLeft,
  people: Users,
  unit_memberships: Users,
  approvals: ShieldCheck,
  reports: ChartNoAxesCombined,
  settings: Settings,
  materials: Building2,
};
const emptyState: State = {
  configured: false,
  user: null,
  condos: [],
  memberships: [],
  members: [],
  records: [],
  approvals: [],
};
async function request(url: string, body?: unknown) {
  const res = await fetch(url, {
    cache: "no-store",
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error || "Não foi possível concluir. Tente novamente.",
    );
  return data;
}
function Badge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>{labels[status] || status}</span>
  );
}
function Empty({
  title,
  children,
  icon: Icon = ClipboardList,
}: {
  title: string;
  children?: ReactNode;
  icon?: typeof Building2;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={27} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const last = document.activeElement as HTMLElement | null;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(
          '[aria-modal="true"]',
        );
        const nodes = dialog?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
        );
        if (nodes?.length) {
          const first = nodes[0],
            end = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            end.focus();
          } else if (!e.shiftKey && document.activeElement === end) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    setTimeout(
      () =>
        document
          .querySelector<HTMLElement>('[aria-modal="true"] button')
          ?.focus(),
      0,
    );
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
      last?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Central() {
  const [state, setState] = useState<State>(emptyState),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [view, setView] = useState("dashboard"),
    [mobile, setMobile] = useState(false),
    [login, setLogin] = useState(false),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Item | null>(null),
    [editor, setEditor] = useState<{ kind: Kind; item?: Item } | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [detailError, setDetailError] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [assigned, setAssigned] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [block, setBlock] = useState(""),
    [password, setPassword] = useState(false);
  const condo = state.condos.find((c) => c.id === state.selected),
    member = state.memberships.find((m) => m.condominium_id === state.selected),
    ready = !!(state.user && condo);
  const load = useCallback(async (cid?: string) => {
    setLoading(true);
    setError("");
    try {
      const s = await request(
        "/api/state" + (cid ? "?condominium=" + cid : ""),
      );
      setState({ ...emptyState, ...s });
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Sessão"))
        setState({ ...emptyState, configured: true });
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const p = new URLSearchParams(location.search);
    setView(p.get("view") || "dashboard");
    setStatus(p.get("status") || "");
    setQuery(p.get("q") || "");
    setAssigned(p.get("assigned") || "");
    setFrom(p.get("from") || "");
    setTo(p.get("to") || "");
    setBlock(p.get("block") || "");
    setPassword(p.get("password") === "1");
    if (p.has("auth_error"))
      setError("O link de acesso expirou ou é inválido. Solicite outro.");
  }, [load]);
  useEffect(() => {
    if (loading) return;
    const p = new URLSearchParams();
    if (view !== "dashboard") p.set("view", view);
    if (status) p.set("status", status);
    if (query) p.set("q", query);
    if (assigned) p.set("assigned", assigned);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (block) p.set("block", block);
    if (password) p.set("password", "1");
    history.replaceState(null, "", p.size ? "/?" + p : "/");
  }, [view, status, query, assigned, from, to, block, loading, password]);
  const openDetail = useCallback(async (item: Item) => {
    setSelected(item);
    setDetail(null);
    setDetailError("");
    try {
      setDetail(
        await request(`/api/state?record=${item.id}&revision=${item.revision}`),
      );
    } catch (e) {
      setDetailError((e as Error).message);
    }
  }, []);
  const closeDetail = useCallback(() => setSelected(null), []),
    closeEditor = useCallback(() => setEditor(null), []);
  const navigate = (v: string, s = "") => {
    setView(v);
    setStatus(s);
    setQuery("");
    setAssigned("");
    setBlock("");
    setMobile(false);
    setSelected(null);
  };
  const mutate = async (body: unknown, success = "Alteração registrada") => {
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/command", body);
      setNotice(success);
      await load(state.selected);
      return result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  };
  const act = async (
    item: Item,
    action: string,
    payload: Record<string, unknown> = {},
  ) => {
    try {
      await mutate({
        command: "action",
        id: item.id,
        revision: item.revision,
        action,
        payload,
      });
      setSelected(null);
    } catch {}
  };
  const today = condo
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: condo.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())
    : new Date().toISOString().slice(0, 10);
  const periodItems = filterItems(
    state.records,
    "",
    query,
    "",
    assigned,
    from,
    to,
    block,
  );
  const series = dailySeries(periodItems, today, condo?.timezone);
  const seriesMax = Math.max(1, ...series.map((s) => s.count));
  let filtered = filterItems(
    state.records,
    modules.some((m) => m.key === view) ? view : "",
    query,
    status === "overdue" ? "" : status,
    assigned,
    from,
    to,
    block,
  );
  if (status === "overdue")
    filtered = filtered.filter(
      (i) =>
        i.due_date &&
        i.due_date < today &&
        !["done", "resolved", "cancelled"].includes(i.status),
    );
  const title =
    view === "dashboard"
      ? "Visão geral"
      : view === "approvals"
        ? "Aprovações"
        : view === "reports"
          ? "Relatórios e auditoria"
          : view === "settings"
            ? "Configurações"
            : view === "materials"
              ? "Custos e materiais"
              : modules.find((m) => m.key === view)?.label ||
                "Página não encontrada";
  const description =
    view === "dashboard"
      ? "A rotina do condomínio, com tudo no lugar."
      : modules.find((m) => m.key === view)?.description || "";
  const allowRead =
    !modules.some((m) => m.key === view) || can(member, view + ".read");
  const name = (id: string | null) =>
    state.members.find((m) => m.user_id === id)?.display_name ||
    (id ? "Conta " + id.slice(0, 8) : "Não atribuído");
  const navEntries = [
    { key: "dashboard", label: "Visão geral" },
    ...modules.slice(0, 6),
    { key: "approvals", label: "Aprovações" },
    ...modules.slice(6),
    { key: "reports", label: "Relatórios e auditoria" },
    { key: "materials", label: "Custos e materiais" },
    { key: "settings", label: "Configurações" },
  ];
  const openEditor = (kind: Kind, item?: Item) => {
    setError("");
    setSelected(null);
    setEditor({ kind, item });
  };
  const button = (label: string, fn: () => void, secondary = false) => (
    <button
      className={secondary ? "button secondary" : "button"}
      disabled={busy}
      onClick={fn}
    >
      {label}
    </button>
  );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Ir para o conteúdo
      </a>
      {mobile && (
        <button
          className="nav-overlay"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <a className="brand" href="/" aria-label="Central Condomínio, início">
          <span className="brand-icon">
            <Building2 size={26} />
          </span>
          <span>
            central<span className="brand-sub">condomínio</span>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">
            <Building2 size={18} />
          </span>
          <div>
            <strong>{condo?.name || "Seu condomínio"}</strong>
            <small>
              {ready ? "Central de operação" : "Ambiente em preparação"}
            </small>
          </div>
        </div>
        <div className="nav-label">Gestão do condomínio</div>
        <nav aria-label="Navegação principal">
          {navEntries
            .filter(
              (n) =>
                !ready ||
                !modules.some((m) => m.key === n.key) ||
                can(member, n.key + ".read"),
            )
            .map((n, i) => {
              const Icon = icons[n.key] || ClipboardList;
              return (
                <div key={n.key}>
                  {i === 9 && <div className="nav-divider" />}
                  <button
                    className={`nav-item ${view === n.key ? "active" : ""}`}
                    aria-current={view === n.key ? "page" : undefined}
                    onClick={() => navigate(n.key)}
                  >
                    <Icon size={19} />
                    <span>{n.label}</span>
                    {n.key === "materials" ? (
                      <span className="soon">Futuro</span>
                    ) : n.key === "requests" &&
                      ready &&
                      state.records.some(
                        (r) => r.kind === "requests" && r.status === "open",
                      ) ? (
                      <span className="nav-count">
                        {
                          state.records.filter(
                            (r) => r.kind === "requests" && r.status === "open",
                          ).length
                        }
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
        </nav>
        <div className="sidebar-footer">
          <span className="security-icon">
            <ShieldCheck size={20} />
          </span>
          <p>
            Gestão com responsabilidade
            <small>Registros, evidências e transparência.</small>
          </p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>Central de operação</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="account">
            {state.condos.length > 1 && (
              <select
                aria-label="Condomínio ativo"
                value={state.selected}
                onChange={(e) => {
                  setSelected(null);
                  void load(e.target.value);
                }}
              >
                {state.condos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {state.user ? (
              <>
                <span className="account-copy">
                  <strong>{member?.display_name || state.user.email}</strong>
                  <small>
                    {labels[member?.role || ""] || "Conta autenticada"}
                  </small>
                </span>
                <span className="avatar">
                  {(member?.display_name || state.user.email)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <button
                  className="icon-button"
                  aria-label="Sair"
                  onClick={async () => {
                    try {
                      await request("/api/auth", { action: "logout" });
                      setSelected(null);
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button className="button small" onClick={() => setLogin(true)}>
                <LockKeyhole size={15} />
                Entrar
              </button>
            )}
          </div>
        </header>
        <main id="main" className="content">
          <div className="page-heading">
            <div>
              <div className="page-context">
                <span className="live-dot" />
                {member?.role === "manager"
                  ? "Visão do síndico"
                  : "Administração e operação"}
              </div>
              <h1>{title}</h1>
              {description && <p>{description}</p>}
            </div>
            <div className="heading-actions">
              <button
                className="button secondary small"
                disabled={loading}
                onClick={() => void load(state.selected)}
              >
                <RefreshCw size={15} className={loading ? "spin" : ""} />
                Atualizar
              </button>
              {ready &&
                modules.some((m) => m.key === view) &&
                view !== "checklist_runs" &&
                can(member, view + ".write") &&
                member?.role !== "operator" && (
                  <button
                    className="button"
                    onClick={() => openEditor(view as Kind)}
                  >
                    <Plus size={18} />
                    Novo registro
                  </button>
                )}
            </div>
          </div>
          {error && (
            <div role="alert" className="alert error">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Fechar erro"
                onClick={() => setError("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="alert success">
              <Check size={18} />
              <span>{notice}</span>
              <button
                className="icon-button"
                aria-label="Fechar confirmação"
                onClick={() => setNotice("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading-state" role="status">
              <RefreshCw className="spin" />
              Carregando sua central…
            </div>
          ) : null}
          {!loading && !state.configured && (
            <div className="setup-banner">
              <div className="setup-symbol">
                <Building2 size={27} />
              </div>
              <div>
                <strong>Sua central está pronta para receber os dados</strong>
                <p>
                  Conecte o Supabase para ativar login, registros e
                  armazenamento privado. Nenhum dado de demonstração é exibido
                  como real.
                </p>
                <button
                  className="text-button"
                  onClick={() => navigate("settings")}
                >
                  Ver configuração necessária <ArrowUpRight size={15} />
                </button>
              </div>
              <span className="setup-label">Conexão pendente</span>
            </div>
          )}
          {!loading && state.configured && !state.user && (
            <div className="alert info">
              <LockKeyhole size={20} />
              <span>
                Entre com sua conta para acessar os registros do condomínio.
              </span>
              <button className="button small" onClick={() => setLogin(true)}>
                Entrar
              </button>
            </div>
          )}
          {!loading && state.user && !condo && (
            <Bootstrap
              busy={busy}
              onSave={async (name, displayName) => {
                await mutate(
                  { command: "bootstrap", name, displayName },
                  "Condomínio criado",
                );
              }}
            />
          )}
          {!loading && view === "dashboard" && (
            <>
              <div className="dashboard-period">
                <span>Período de criação dos registros</span>
                <label>
                  De
                  <input
                    aria-label="Início do período"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </label>
                <label>
                  Até
                  <input
                    aria-label="Fim do período"
                    type="date"
                    min={from || undefined}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
              </div>
              <div className="section-heading">
                <h2>O que precisa da sua atenção</h2>
                <span>
                  {ready
                    ? `Atualizado ${dateLabel(state.updatedAt, true)}`
                    : "Aguardando conexão de dados"}
                </span>
              </div>
              <div className="metrics">
                {[
                  {
                    label: "Solicitações abertas",
                    value: periodItems.filter(
                      (i) => i.kind === "requests" && i.status === "open",
                    ).length,
                    icon: ClipboardList,
                    target: "requests",
                    status: "open",
                    caption: "Ver solicitações abertas",
                    tone: "blue",
                  },
                  member?.role === "manager"
                    ? {
                        label: "Solicitações atrasadas",
                        value: periodItems.filter(
                          (i) =>
                            i.kind === "requests" &&
                            i.due_date &&
                            i.due_date < today &&
                            !["resolved", "cancelled"].includes(i.status),
                        ).length,
                        icon: Clock,
                        target: "requests",
                        status: "overdue",
                        caption: "Acompanhar os prazos",
                        tone: "amber",
                      }
                    : {
                        label: "Aguardando informação",
                        value: periodItems.filter(
                          (i) =>
                            i.kind === "requests" && i.status === "waiting",
                        ).length,
                        icon: Clock,
                        target: "requests",
                        status: "waiting",
                        caption: "Acompanhar retornos",
                        tone: "amber",
                      },
                  {
                    label: "Serviços em andamento",
                    value: periodItems.filter(
                      (i) =>
                        i.kind === "services" && i.status === "in_progress",
                    ).length,
                    icon: Wrench,
                    target: "services",
                    status: "in_progress",
                    caption: "Acompanhar a execução",
                    tone: "teal",
                  },
                  {
                    label: "Aprovações pendentes",
                    value: periodItems.filter((i) => i.status === "pending")
                      .length,
                    icon: ShieldCheck,
                    target: "approvals",
                    status: "pending",
                    caption: "Consultar fila de decisões",
                    tone: "violet",
                  },
                ].map((m) => (
                  <button
                    className={`metric ${m.tone}`}
                    key={m.label}
                    disabled={!ready}
                    onClick={() => navigate(m.target, m.status)}
                  >
                    <span className="metric-top">
                      {m.label}
                      <m.icon size={19} />
                    </span>
                    <strong>{ready ? m.value : "—"}</strong>
                    <span className="metric-bottom">
                      {m.caption}
                      <ArrowUpRight size={16} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Solicitações por status</h2>
                      <p>Uma visão do atendimento</p>
                    </div>
                    <span className="subtle-tag">Dados do condomínio</span>
                  </div>
                  {ready ? (
                    <div className="status-chart">
                      {[
                        "open",
                        "in_progress",
                        "waiting",
                        "resolved",
                        "cancelled",
                      ].map((s) => {
                        const n = periodItems.filter(
                            (r) => r.kind === "requests" && r.status === s,
                          ).length,
                          total = periodItems.filter(
                            (r) => r.kind === "requests",
                          ).length;
                        return (
                          <button
                            key={s}
                            onClick={() => navigate("requests", s)}
                          >
                            <span>{labels[s]}</span>
                            <span className="chart-track">
                              <span
                                style={{
                                  width: total ? `${(n / total) * 100}%` : "0%",
                                }}
                              />
                            </span>
                            <strong>{n}</strong>
                          </button>
                        );
                      })}
                      {!state.records.some((i) => i.kind === "requests") && (
                        <p className="chart-note">
                          Os indicadores serão calculados a partir das
                          solicitações cadastradas.
                        </p>
                      )}
                    </div>
                  ) : (
                    <Empty title="O atendimento começa por aqui">
                      Ao conectar seu condomínio, acompanhe a distribuição das
                      solicitações por status.
                    </Empty>
                  )}
                </section>
                <section className="panel daily-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>A operação de hoje</h2>
                      <p>
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date())}
                      </p>
                    </div>
                    <span className="daily-icon">
                      <ListChecks size={20} />
                    </span>
                  </div>
                  <div className="daily-stat">
                    <span>Serviços com prazo hoje</span>
                    <strong>
                      {ready
                        ? state.records.filter(
                            (r) =>
                              r.kind === "services" && r.due_date === today,
                          ).length
                        : "—"}
                    </strong>
                  </div>
                  <div className="daily-stat">
                    <span>Serviços concluídos hoje</span>
                    <strong>
                      {ready
                        ? state.records.filter(
                            (r) =>
                              r.kind === "services" &&
                              r.status === "done" &&
                              new Intl.DateTimeFormat("en-CA", {
                                timeZone: condo?.timezone,
                                dateStyle: "short",
                              }).format(new Date(r.updated_at)) ===
                                new Intl.DateTimeFormat("en-CA", {
                                  timeZone: condo?.timezone,
                                  dateStyle: "short",
                                }).format(new Date()),
                          ).length
                        : "—"}
                    </strong>
                  </div>
                  <div className="daily-stat">
                    <span>Checklists pendentes</span>
                    <strong>
                      {ready
                        ? state.records.filter(
                            (r) =>
                              r.kind === "checklist_runs" &&
                              r.due_date === today &&
                              r.status !== "done",
                          ).length
                        : "—"}
                    </strong>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("checklist_runs")}
                  >
                    Abrir checklist diário <ChevronRight size={16} />
                  </button>
                </section>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Próximos passos da gestão</h2>
                    <p>Prazo, responsável e acompanhamento em um só lugar.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("services")}
                  >
                    Ver serviços <ChevronRight size={16} />
                  </button>
                </div>
                {ready &&
                state.records.some(
                  (i) =>
                    i.kind === "services" &&
                    !["done", "cancelled"].includes(i.status),
                ) ? (
                  <ItemTable
                    items={state.records
                      .filter(
                        (i) =>
                          i.kind === "services" &&
                          !["done", "cancelled"].includes(i.status),
                      )
                      .sort((a, b) =>
                        (a.due_date || "9999").localeCompare(
                          b.due_date || "9999",
                        ),
                      )
                      .slice(0, 5)}
                    name={name}
                    onOpen={openDetail}
                  />
                ) : (
                  <Empty
                    title={
                      ready
                        ? "Nenhum serviço pendente"
                        : "Tudo começa com uma gestão organizada"
                    }
                    icon={Wrench}
                  >
                    {ready
                      ? "Cadastre um serviço ou crie um a partir de uma solicitação."
                      : "Conecte os dados para organizar solicitações, distribuir serviços e acompanhar cada conclusão."}
                  </Empty>
                )}
              </section>
              <section className="panel trend-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Evolução do atendimento</h2>
                    <p>
                      Solicitações criadas nos últimos sete dias, dentro do
                      período selecionado.
                    </p>
                  </div>
                </div>
                {ready ? (
                  <div className="trend-chart">
                    {series.map(({ key, count }) => {
                      return (
                        <div key={key}>
                          <strong>{count}</strong>
                          <span className="trend-track">
                            <span
                              style={{
                                height: `${(count / seriesMax) * 100}%`,
                              }}
                            />
                          </span>
                          <small>
                            {key.slice(8)}/{key.slice(5, 7)}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty
                    title="A evolução aparecerá com os primeiros registros"
                    icon={ChartNoAxesCombined}
                  >
                    Sem valores simulados. A série será calculada a partir das
                    datas das solicitações.
                  </Empty>
                )}
              </section>
              <div className="footnote">
                <ShieldCheck size={16} />
                Indicadores refletem apenas registros que sua conta tem
                permissão para consultar.
              </div>
            </>
          )}
          {!loading && modules.some((m) => m.key === view) && (
            <>
              {!ready ? (
                <section className="panel">
                  <Empty
                    title={`Seus ${title.toLowerCase()} aparecerão aqui`}
                    icon={icons[view]}
                  >
                    {state.configured
                      ? "Entre e selecione seu condomínio para começar."
                      : "A conexão com o banco é necessária para consultar e salvar registros."}
                  </Empty>
                </section>
              ) : !allowRead ? (
                <Empty title="Acesso não concedido" icon={LockKeyhole}>
                  Seu papel não possui permissão para consultar este módulo.
                </Empty>
              ) : (
                <>
                  <Filters
                    query={query}
                    setQuery={setQuery}
                    status={status}
                    setStatus={setStatus}
                    assigned={assigned}
                    setAssigned={setAssigned}
                    from={from}
                    setFrom={setFrom}
                    to={to}
                    setTo={setTo}
                    block={block}
                    setBlock={setBlock}
                    members={state.members}
                    blocks={state.records.filter((r) => r.kind === "blocks")}
                    statuses={Array.from(
                      new Set(
                        state.records
                          .filter((r) => r.kind === view)
                          .map((i) => i.status),
                      ),
                    )}
                  />
                  {view === "services" ? (
                    <div className="kanban">
                      {[
                        "todo",
                        "in_progress",
                        "pending",
                        "done",
                        "cancelled",
                      ].map((s) => (
                        <section className="kanban-column" key={s}>
                          <h2>
                            <span className={`status-dot ${s}`} />
                            {labels[s]}
                            <span>
                              {filtered.filter((i) => i.status === s).length}
                            </span>
                          </h2>
                          {filtered
                            .filter((i) => i.status === s)
                            .map((i) => (
                              <button
                                className="service-card"
                                key={i.id}
                                onClick={() => void openDetail(i)}
                              >
                                <Badge
                                  status={String(i.data.priority || "normal")}
                                />
                                <strong>{i.title}</strong>
                                <p>
                                  {text(i.data, "location") ||
                                    "Local não informado"}
                                </p>
                                <footer>
                                  <span>{name(i.assigned_to)}</span>
                                  <span>
                                    <Clock size={13} />
                                    {dateLabel(i.due_date)}
                                  </span>
                                </footer>
                              </button>
                            ))}
                          {!filtered.some((i) => i.status === s) && (
                            <p className="kanban-empty">Nenhum serviço</p>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <section className="panel">
                      <div className="list-summary">
                        <strong>
                          {filtered.length}{" "}
                          {filtered.length === 1 ? "registro" : "registros"}
                        </strong>
                        <span>Selecione para ver detalhes e histórico</span>
                      </div>
                      {filtered.length ? (
                        <ItemTable
                          items={filtered}
                          name={name}
                          onOpen={openDetail}
                        />
                      ) : (
                        <Empty
                          title="Nenhum registro encontrado"
                          icon={icons[view]}
                        >
                          Cadastre o primeiro registro ou ajuste os filtros da
                          lista.
                        </Empty>
                      )}
                    </section>
                  )}
                </>
              )}
            </>
          )}
          {!loading && view === "approvals" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Fila de decisões</h2>
                  <p>
                    Regras configuráveis. Uma nova versão exige uma nova
                    decisão.
                  </p>
                </div>
                <ShieldCheck size={22} />
              </div>
              {ready && can(member, "approvals.read") ? (
                state.approvals.filter((a) => a.status === "pending").length ? (
                  state.approvals
                    .filter((a) => a.status === "pending")
                    .map((a) => {
                      const i = state.records.find((r) => r.id === a.record_id);
                      return (
                        <button
                          className="approval-row"
                          key={a.id}
                          onClick={() => i && void openDetail(i)}
                        >
                          <span>
                            <strong>{i?.title || "Registro sem acesso"}</strong>
                            <small>
                              Solicitado por {name(a.requested_by)} · Versão{" "}
                              {a.revision}
                            </small>
                          </span>
                          <Badge status={a.status} />
                          <ChevronRight size={18} />
                        </button>
                      );
                    })
                ) : (
                  <Empty title="Nenhuma aprovação pendente" icon={ShieldCheck}>
                    Publicações e serviços entram nesta fila quando as regras
                    exigirem aprovação.
                  </Empty>
                )
              ) : (
                <Empty
                  title={ready ? "Permissão necessária" : "Aguardando acesso"}
                  icon={LockKeyhole}
                >
                  A fila depende de autenticação e da permissão de consulta de
                  aprovações.
                </Empty>
              )}
            </section>
          )}
          {!loading && view === "reports" && (
            <>
              <Filters
                query={query}
                setQuery={setQuery}
                status={status}
                setStatus={setStatus}
                assigned={assigned}
                setAssigned={setAssigned}
                from={from}
                setFrom={setFrom}
                to={to}
                setTo={setTo}
                block={block}
                setBlock={setBlock}
                members={state.members}
                blocks={state.records.filter((i) => i.kind === "blocks")}
                statuses={Object.keys(labels).filter((k) =>
                  [
                    "open",
                    "in_progress",
                    "waiting",
                    "resolved",
                    "todo",
                    "done",
                    "pending",
                    "published",
                    "cancelled",
                  ].includes(k),
                )}
              />
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Registros da gestão</h2>
                    <p>
                      Filtros por data de criação. Histórico e versões nos
                      detalhes de cada registro.
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    disabled={!ready || !can(member, "reports.export") || busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const response = await fetch("/api/export", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            condominium: state.selected,
                            query,
                            status,
                            assigned,
                            from,
                            to,
                            block,
                          }),
                        });
                        if (!response.ok) {
                          const j = await response.json();
                          throw new Error(j.error);
                        }
                        const url = URL.createObjectURL(await response.blob()),
                          a = document.createElement("a");
                        a.href = url;
                        a.download = "central-relatorio.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                        setNotice("Relatório exportado e ação auditada");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Download size={16} />
                    Exportar CSV
                  </button>
                </div>
                {ready ? (
                  <ItemTable items={filtered} name={name} onOpen={openDetail} />
                ) : (
                  <Empty
                    title="Relatórios com origem verificável"
                    icon={ChartNoAxesCombined}
                  >
                    Os resultados serão calculados a partir dos registros
                    autorizados do condomínio.
                  </Empty>
                )}
              </section>
            </>
          )}
          {!loading && view === "materials" && (
            <section className="panel">
              <Empty title="Integração ainda não ativada" icon={Building2}>
                Custos e materiais serão integrados ao Almox Aqua em uma fase
                futura. Nenhum estoque ou valor financeiro é calculado nesta
                versão.
              </Empty>
            </section>
          )}
          {!loading && view === "settings" && (
            <SettingsPanel
              state={state}
              condo={condo}
              member={member}
              busy={busy}
              mutate={mutate}
            />
          )}
          <footer className="content-footer">
            <span>Central Condomínio</span>
            <span>Organizar. Acompanhar. Comprovar.</span>
          </footer>
        </main>
      </div>
      {(login || password) && (
        <Auth
          configured={state.configured}
          password={password}
          onClose={() => {
            setLogin(false);
            setPassword(false);
          }}
          onSuccess={async () => {
            setLogin(false);
            setPassword(false);
            await load();
          }}
        />
      )}
      {editor && (
        <Editor
          kind={editor.kind}
          item={editor.item}
          records={state.records}
          members={state.members}
          member={member}
          busy={busy}
          onClose={closeEditor}
          onSave={async (values) => {
            const result = await mutate(
              {
                command: "save",
                condominium: state.selected,
                kind: editor.kind,
                id: editor.item?.id || null,
                revision: editor.item?.revision || 0,
                ...values,
              },
              "Registro salvo. Anexos podem ser adicionados nos detalhes.",
            );
            setEditor(null);
            if (result.data) {
              const s = await request(
                "/api/state?condominium=" + state.selected,
              );
              setState(s);
              const item = s.records.find((r: Item) => r.id === result.data);
              if (item) void openDetail(item);
            }
          }}
        />
      )}
      {selected && (
        <Modal title={selected.title} onClose={closeDetail}>
          <div className="detail-content">
            {error && (
              <div role="alert" className="alert error">
                {error}
              </div>
            )}
            <div className="detail-meta">
              <Badge status={selected.status} />
              <span>Versão {selected.revision}</span>
              <span>Protocolo {selected.id}</span>
            </div>
            <p className="detail-body">
              {text(selected.data, "description") ||
                text(selected.data, "body") ||
                "Sem descrição adicional."}
            </p>
            <dl className="detail-grid">
              <div>
                <dt>Responsável</dt>
                <dd>{name(selected.assigned_to)}</dd>
              </div>
              <div>
                <dt>Prazo</dt>
                <dd>{dateLabel(selected.due_date)}</dd>
              </div>
              <div>
                <dt>Criado por</dt>
                <dd>{name(selected.created_by)}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>{dateLabel(selected.updated_at, true)}</dd>
              </div>
            </dl>
            {["people", "units", "blocks", "unit_memberships"].includes(
              selected.kind,
            ) && (
              <dl className="detail-grid">
                {Object.entries(selected.data).map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      {(
                        {
                          email: "E-mail",
                          phone: "Telefone",
                          block_id: "Bloco",
                          unit_id: "Unidade",
                          person_id: "Pessoa",
                          relationship: "Vínculo",
                          validated: "Vínculo validado",
                        } as Record<string, string>
                      )[key] || key}
                    </dt>
                    <dd>
                      {typeof value === "boolean"
                        ? value
                          ? "Sim"
                          : "Não"
                        : state.records.find((r) => r.id === value)?.title ||
                          labels[String(value)] ||
                          String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {text(selected.data, "source_request_id") && (
              <p className="callout">
                Solicitação de origem:{" "}
                <button
                  className="text-button"
                  onClick={() => {
                    const source = state.records.find(
                      (r) => r.id === selected.data.source_request_id,
                    );
                    if (source) void openDetail(source);
                  }}
                >
                  {text(selected.data, "source_request_id")}
                </button>
              </p>
            )}
            {can(member, selected.kind + ".write") && (
              <div className="detail-actions">
                {selected.kind !== "checklist_runs" &&
                  !["done", "cancelled"].includes(selected.status) &&
                  button(
                    "Editar registro",
                    () => openEditor(selected.kind, selected),
                    true,
                  )}
                {transitions(selected).map((s) =>
                  button(
                    labels[s],
                    () => {
                      const reason = prompt(
                        s === "in_progress" &&
                          ["done", "resolved"].includes(selected.status)
                          ? "Motivo da reabertura"
                          : s === "done"
                            ? "Justificativa da conclusão (ou anexe uma foto de evidência)"
                            : "Observação / motivo",
                      );
                      if (reason !== null)
                        void act(selected, "status", { status: s, reason });
                    },
                    true,
                  ),
                )}
                {selected.kind === "requests" &&
                  can(member, "services.write") &&
                  button(
                    "Criar serviço vinculado",
                    () => void act(selected, "create_service"),
                  )}
                {selected.kind === "checklist_templates" &&
                  can(member, "checklist_runs.write") &&
                  button(
                    "Gerar checklist de hoje",
                    () => void act(selected, "generate"),
                  )}
                {["announcements", "documents"].includes(selected.kind) &&
                  selected.status === "draft" &&
                  can(member, selected.kind + ".publish") &&
                  button(
                    "Publicar / enviar para aprovação",
                    () => void act(selected, "publish"),
                  )}
              </div>
            )}
            {selected.status === "pending" &&
              can(member, "approvals.decide") && (
                <div className="callout">
                  <p>
                    A decisão vale somente para esta versão. O solicitante não
                    pode aprovar a própria solicitação.
                  </p>
                  {["approve", "reject"].map((a) =>
                    button(
                      a === "approve" ? "Aprovar" : "Solicitar revisão",
                      () => {
                        const reason = prompt("Justificativa da decisão");
                        if (reason) void act(selected, a, { reason });
                      },
                      a === "reject",
                    ),
                  )}
                </div>
              )}
            {selected.kind === "checklist_runs" &&
              Array.isArray(selected.data.items) && (
                <section className="detail-section">
                  <h3>Execução do checklist</h3>
                  {(
                    selected.data.items as {
                      label: string;
                      done: boolean;
                      completed_at?: string;
                      completed_by?: string;
                      note?: string;
                    }[]
                  ).map((i, index) => (
                    <div className="checklist-item" key={index}>
                      <span
                        className={`check-indicator ${i.done ? "checked" : ""}`}
                      >
                        {i.done ? <Check size={15} /> : index + 1}
                      </span>
                      <div>
                        <strong>{i.label}</strong>
                        {i.done && (
                          <small>
                            {name(i.completed_by || null)} ·{" "}
                            {dateLabel(i.completed_at, true)}{" "}
                            {i.note && `· ${i.note}`}
                          </small>
                        )}
                      </div>
                      {!i.done && can(member, "checklist_runs.write") && (
                        <button
                          className="button small secondary"
                          disabled={busy}
                          onClick={() => {
                            const note = prompt(
                              "Observação da execução (opcional)",
                            );
                            if (note !== null)
                              void act(selected, "check_item", { index, note });
                          }}
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  ))}
                </section>
              )}
            {["announcements", "documents"].includes(selected.kind) && (
              <section className="detail-section">
                <h3>Público e distribuição</h3>
                <Audience item={selected} onError={setError} />
                {selected.status === "published" && (
                  <div className="alert info">
                    <Info size={18} />
                    <span>
                      Publicado no sistema, aviso externo não configurado.
                      Destinatários, envios, aberturas e ciências são eventos
                      distintos.
                    </span>
                  </div>
                )}
                {detail && (
                  <div className="distribution">
                    <span>
                      Destinatários nesta versão:{" "}
                      <strong>{detail.recipients}</strong>
                    </span>
                    <span>
                      Envios registrados:{" "}
                      <strong>
                        {
                          detail.delivery.filter(
                            (e) => e.event === "notification_sent",
                          ).length
                        }
                      </strong>
                    </span>
                    <span>
                      Aberturas:{" "}
                      <strong>
                        {
                          detail.delivery.filter((e) => e.event === "opened")
                            .length
                        }
                      </strong>
                    </span>
                    <span>
                      Ciências:{" "}
                      <strong>
                        {
                          detail.delivery.filter(
                            (e) => e.event === "acknowledged",
                          ).length
                        }
                      </strong>
                    </span>
                  </div>
                )}
              </section>
            )}
            <section className="detail-section">
              <h3>
                <Paperclip size={17} />
                Arquivos privados
              </h3>
              <p className="muted">
                PDF, PNG, JPEG ou WebP, até 10 MB. Uma nova edição exige anexar
                os arquivos da nova versão.
              </p>
              {detail?.attachments
                .filter((a) => a.revision === selected.file_revision)
                .map((a) => (
                  <div className="file-row" key={a.id}>
                    <Paperclip size={16} />
                    <span>
                      {a.name}
                      <small>
                        {a.category} · {(a.size / 1024).toFixed(0)} KB
                      </small>
                    </span>
                    <button
                      className="icon-button"
                      aria-label={`Abrir ${a.name}`}
                      onClick={async () => {
                        try {
                          const r = await request("/api/files?id=" + a.id);
                          window.open(r.url, "_blank", "noopener,noreferrer");
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              {can(member, selected.kind + ".write") &&
                !["published", "pending", "done", "cancelled"].includes(
                  selected.status,
                ) && (
                  <form
                    className="upload-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      try {
                        const form = new FormData(e.currentTarget);
                        form.set("record", selected.id);
                        form.set("revision", String(selected.revision));
                        const res = await fetch("/api/files", {
                            method: "POST",
                            body: form,
                          }),
                          j = await res.json();
                        if (!res.ok) throw new Error(j.error);
                        setNotice("Arquivo anexado com acesso privado");
                        await openDetail(selected);
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <input
                      aria-label="Arquivo"
                      name="file"
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      required
                    />
                    <select name="category" aria-label="Categoria do arquivo">
                      <option value="attachment">Anexo</option>
                      <option value="before">Antes do serviço</option>
                      <option value="after">Depois do serviço</option>
                      <option value="evidence">Evidência</option>
                    </select>
                    <button className="button small" disabled={busy}>
                      Anexar
                    </button>
                  </form>
                )}
            </section>
            {["requests", "services"].includes(selected.kind) && (
              <section className="detail-section">
                <h3>Mensagens e observações</h3>
                {detail?.messages.map((m) => (
                  <div className="message" key={m.id}>
                    <small>
                      {name(m.created_by)} · {dateLabel(m.created_at, true)} ·{" "}
                      {m.visibility === "internal"
                        ? "Interna"
                        : "Externa (sem envio externo)"}
                    </small>
                    <p>{m.body}</p>
                  </div>
                ))}
                {can(member, selected.kind + ".write") && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      await act(selected, "message", {
                        body: form.get("body"),
                        visibility: form.get("visibility"),
                      });
                    }}
                  >
                    <label>
                      Nova mensagem
                      <textarea name="body" required maxLength={5000} />
                    </label>
                    <div className="form-actions">
                      <select
                        name="visibility"
                        aria-label="Visibilidade da mensagem"
                      >
                        <option value="internal">Interna</option>
                        <option value="external">
                          Externa (registro, sem envio)
                        </option>
                      </select>
                      <button className="button" disabled={busy}>
                        Registrar mensagem
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}
            {detailError ? (
              <div role="alert" className="alert error">
                {detailError}
              </div>
            ) : !detail ? (
              <p role="status" className="muted">
                Carregando histórico…
              </p>
            ) : (
              <>
                <section className="detail-section">
                  <h3>Histórico e autoria</h3>
                  {detail.events.length ? (
                    detail.events.map((ev) => (
                      <div className="timeline" key={ev.id}>
                        <span className="timeline-dot" />
                        <div>
                          <strong>{eventLabel(ev.action)}</strong>
                          <p>
                            {name(ev.actor_id)} ·{" "}
                            {dateLabel(ev.created_at, true)}
                          </p>
                          {typeof ev.detail.reason === "string" &&
                            ev.detail.reason && <p>{ev.detail.reason}</p>}
                          {ev.detail.from && ev.detail.to ? (
                            <p>
                              {labels[String(ev.detail.from)]} →{" "}
                              {labels[String(ev.detail.to)]}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">
                      O histórico de auditoria exige permissão específica.
                    </p>
                  )}
                </section>
                <section className="detail-section">
                  <h3>Versões preservadas</h3>
                  {detail.versions.map((v) => (
                    <details key={v.revision} className="version">
                      <summary>
                        Versão {v.revision} · {dateLabel(v.created_at, true)} ·{" "}
                        {labels[v.snapshot.status] || v.snapshot.status}
                      </summary>
                      <h4>{v.snapshot.title}</h4>
                      <p className="detail-body">
                        {String(
                          v.snapshot.data.body ||
                            v.snapshot.data.description ||
                            "Sem texto adicional.",
                        )}
                      </p>
                      {v.snapshot.files?.map((a) => (
                        <button
                          key={a.id}
                          className="text-button"
                          onClick={async () => {
                            try {
                              const r = await request("/api/files?id=" + a.id);
                              window.open(
                                r.url,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          <Paperclip size={14} />
                          {a.name}
                        </button>
                      ))}
                    </details>
                  ))}
                </section>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
function eventLabel(action: string) {
  return (
    (
      {
        "record.created": "Registro criado",
        "record.updated": "Registro editado",
        "record.status": "Estado alterado",
        "record.publish": "Publicação solicitada",
        "record.approve": "Aprovação registrada",
        "record.reject": "Revisão solicitada",
        "record.check_item": "Item de checklist concluído",
        "service.linked": "Serviço vinculado",
        "service.created_from_request":
          "Serviço criado a partir de solicitação",
        "checklist.generated": "Execução do dia gerada",
        "attachment.created": "Arquivo privado anexado",
        "message.created": "Mensagem registrada",
      } as Record<string, string>
    )[action] || action
  );
}
function ItemTable({
  items,
  name,
  onOpen,
}: {
  items: Item[];
  name: (id: string | null) => string;
  onOpen: (i: Item) => unknown;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Registro</th>
            <th>Status</th>
            <th>Responsável</th>
            <th>Prazo</th>
            <th>
              <span className="sr-only">Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>
                <button className="table-title" onClick={() => onOpen(i)}>
                  {i.title}
                  <small>
                    {modules.find((m) => m.key === i.kind)?.label} ·{" "}
                    {i.id.slice(0, 8)}
                  </small>
                </button>
              </td>
              <td>
                <Badge status={i.status} />
              </td>
              <td>{name(i.assigned_to)}</td>
              <td>{dateLabel(i.due_date)}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Detalhes de ${i.title}`}
                  onClick={() => onOpen(i)}
                >
                  <ChevronRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && (
        <Empty title="Nenhum registro neste período">
          Ajuste os filtros ou cadastre os primeiros registros.
        </Empty>
      )}
    </div>
  );
}
function Filters(p: {
  query: string;
  setQuery: (s: string) => void;
  status: string;
  setStatus: (s: string) => void;
  assigned: string;
  setAssigned: (s: string) => void;
  from: string;
  setFrom: (s: string) => void;
  to: string;
  setTo: (s: string) => void;
  block: string;
  setBlock: (s: string) => void;
  members: Member[];
  blocks: Item[];
  statuses: string[];
}) {
  return (
    <div className="filters">
      <label className="search-input">
        <Search size={17} />
        <input
          aria-label="Buscar registros"
          placeholder="Buscar por título ou descrição…"
          value={p.query}
          onChange={(e) => p.setQuery(e.target.value)}
        />
      </label>
      <select
        aria-label="Filtrar por status"
        value={p.status}
        onChange={(e) => p.setStatus(e.target.value)}
      >
        <option value="">Todos os status</option>
        {p.status === "overdue" && <option value="overdue">Atrasados</option>}
        {p.statuses.map((s) => (
          <option key={s} value={s}>
            {labels[s] || s}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrar por responsável"
        value={p.assigned}
        onChange={(e) => p.setAssigned(e.target.value)}
      >
        <option value="">Todos os responsáveis</option>
        {p.members.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.display_name}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrar por bloco"
        value={p.block}
        onChange={(e) => p.setBlock(e.target.value)}
      >
        <option value="">Todos os blocos</option>
        {p.blocks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </select>
      <label className="date-filter">
        De
        <input
          type="date"
          value={p.from}
          onChange={(e) => p.setFrom(e.target.value)}
        />
      </label>
      <label className="date-filter">
        Até
        <input
          type="date"
          min={p.from || undefined}
          value={p.to}
          onChange={(e) => p.setTo(e.target.value)}
        />
      </label>
      {(p.query || p.status || p.assigned || p.from || p.to || p.block) && (
        <button
          className="text-button"
          onClick={() => {
            p.setQuery("");
            p.setStatus("");
            p.setAssigned("");
            p.setFrom("");
            p.setTo("");
            p.setBlock("");
          }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
function Auth({
  configured,
  password,
  onClose,
  onSuccess,
}: {
  configured: boolean;
  password: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>, action: string) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await request("/api/auth", {
        action,
        email: f.get("email") || undefined,
        password: action === "reset" ? undefined : f.get("password"),
      });
      if (action === "reset")
        setNotice(
          "Se a conta existir, você receberá as instruções de recuperação.",
        );
      else await onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={password ? "Definir nova senha" : "Entrar na Central"}
      onClose={onClose}
    >
      <form
        className="form-body"
        onSubmit={(e) => void submit(e, password ? "update_password" : "login")}
      >
        <div className="auth-mark">
          <Building2 size={32} />
        </div>
        <p className="muted">
          {password
            ? "Escolha uma senha com pelo menos 8 caracteres."
            : "Use a conta autorizada pela administração do condomínio."}
        </p>
        {!configured && (
          <div className="alert info">
            O login será ativado após a conexão ao Supabase.
          </div>
        )}
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="alert success">
            {notice}
          </p>
        )}
        {!password && (
          <label>
            E-mail
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              placeholder="seu@email.com"
            />
          </label>
        )}
        <label>
          {password ? "Nova senha" : "Senha"}
          <input
            type="password"
            name="password"
            minLength={8}
            maxLength={200}
            autoComplete={password ? "new-password" : "current-password"}
            required
          />
        </label>
        <button className="button full" disabled={!configured || busy}>
          {busy
            ? "Aguarde…"
            : password
              ? "Salvar nova senha"
              : "Entrar com segurança"}
          <ChevronRight size={17} />
        </button>
        {!password && (
          <button
            type="button"
            className="text-button"
            disabled={!configured || busy}
            onClick={async (e) => {
              const form = e.currentTarget.closest("form");
              const email = (
                form?.elements.namedItem("email") as HTMLInputElement
              )?.value;
              if (!email) {
                setError("Informe seu e-mail para recuperar a senha.");
                return;
              }
              setBusy(true);
              try {
                await request("/api/auth", { action: "reset", email });
                setNotice(
                  "Se a conta existir, você receberá as instruções de recuperação.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Esqueci minha senha
          </button>
        )}
        <p className="muted small-text">
          <ShieldCheck size={14} /> O acesso é definido pelo seu vínculo e suas
          permissões.
        </p>
      </form>
    </Modal>
  );
}
function Bootstrap({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (name: string, displayName: string) => Promise<void>;
}) {
  return (
    <section className="panel bootstrap">
      <h2>Vamos organizar seu condomínio</h2>
      <p>
        Sua conta ainda não possui vínculo administrativo. Crie um condomínio
        novo ou solicite acesso ao administrador de um condomínio existente.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await onSave(String(f.get("name")), String(f.get("displayName")));
          } catch {}
        }}
      >
        <label>
          Nome do novo condomínio
          <input name="name" required minLength={2} maxLength={120} />
        </label>
        <label>
          Seu nome de identificação
          <input name="displayName" required minLength={2} maxLength={120} />
        </label>
        <button className="button" disabled={busy}>
          Criar meu condomínio
        </button>
      </form>
    </section>
  );
}
function Audience({
  item,
  onError,
}: {
  item: Item;
  onError: (e: string) => void;
}) {
  const [rows, setRows] = useState<
      | {
          person_id: string;
          unit_id: string;
          person_name: string;
          unit_name: string;
        }[]
      | null
    >(null),
    [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="muted">
        Público: {labels[String(item.data.audience || "all")]}. Somente vínculos
        validados são incluídos. A prévia reflete os vínculos atuais; a
        publicação preserva seus destinatários.
      </p>
      <button
        className="button small secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await request("/api/command", {
              command: "audience",
              id: item.id,
            });
            setRows(result.data);
          } catch (e) {
            onError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Conferir destinatários atuais
      </button>
      {rows && (
        <div className="audience-list">
          <strong>
            {new Set(rows.map((r) => r.person_id)).size} pessoas em{" "}
            {new Set(rows.map((r) => r.unit_id)).size} unidades
          </strong>
          {rows.map((r) => (
            <div key={r.person_id + r.unit_id}>
              {r.person_name}
              <span>{r.unit_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Editor({
  kind,
  item,
  records,
  members,
  member,
  busy,
  onClose,
  onSave,
}: {
  kind: Kind;
  item?: Item;
  records: Item[];
  members: Member[];
  member: Member | undefined;
  busy: boolean;
  onClose: () => void;
  onSave: (v: Record<string, unknown>) => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [audience, setAudience] = useState(
      text(item?.data || {}, "audience") || "all",
    );
  const publication = ["announcements", "documents"].includes(kind),
    operation = ["requests", "services", "checklist_templates"].includes(kind);
  const refField = (
    label: string,
    key: string,
    target: Kind,
    required = false,
  ) => (
    <label>
      {label}
      <select
        name={key}
        defaultValue={text(item?.data || {}, key)}
        required={required}
      >
        <option value="">Selecione</option>
        {records
          .filter((r) => r.kind === target)
          .map((r) => (
            <option value={r.id} key={r.id}>
              {r.title}
            </option>
          ))}
      </select>
    </label>
  );
  return (
    <Modal
      title={`${item ? "Editar" : "Criar"} ${modules.find((m) => m.key === kind)?.singular}`}
      onClose={onClose}
    >
      <form
        className="form-body"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget),
            data: Record<string, unknown> = {};
          for (const key of [
            "description",
            "body",
            "priority",
            "location",
            "category",
            "block_id",
            "unit_id",
            "person_id",
            "relationship",
            "email",
            "phone",
          ])
            if (f.has(key)) data[key] = f.get(key);
          if (kind === "unit_memberships")
            data.validated = f.get("validated") === "on";
          if (publication) {
            data.audience = f.get("audience");
            data.audience_ids = f.getAll("audience_ids");
          }
          if (kind === "checklist_templates")
            data.items = String(f.get("items") || "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
          try {
            await onSave({
              title: f.get("title"),
              data,
              assigned: f.get("assigned") || item?.assigned_to || null,
              due: f.get("due") || null,
            });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        {error && (
          <p role="alert" className="alert error">
            {error}
          </p>
        )}
        {item && publication && (
          <div className="alert info">
            <Info size={18} />
            <span>
              Salvar cria um novo rascunho e preserva as versões anteriores.
              Anexe os arquivos desta nova versão antes de publicar.
            </span>
          </div>
        )}
        <label>
          {kind === "people"
            ? "Nome completo"
            : kind === "blocks"
              ? "Nome do bloco"
              : kind === "units"
                ? "Identificação da unidade"
                : "Título"}
          <input
            name="title"
            required
            minLength={2}
            maxLength={180}
            defaultValue={item?.title}
            placeholder={kind === "units" ? "Ex.: Apartamento 101" : undefined}
          />
        </label>
        {kind === "announcements" ? (
          <label>
            Texto do comunicado
            <textarea
              name="body"
              required
              maxLength={20000}
              rows={7}
              defaultValue={text(item?.data || {}, "body")}
            />
          </label>
        ) : (
          !["blocks", "people", "unit_memberships"].includes(kind) && (
            <label>
              Descrição
              <textarea
                name="description"
                maxLength={5000}
                rows={4}
                defaultValue={text(item?.data || {}, "description")}
              />
            </label>
          )
        )}
        {operation && (
          <div className="form-grid">
            <label>
              Responsável
              <select
                name="assigned"
                aria-label="Responsável"
                defaultValue={item?.assigned_to || ""}
                disabled={member?.role === "operator"}
                required={kind === "checklist_templates"}
              >
                <option value="">Não atribuído</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prazo
              <input
                name="due"
                type="date"
                defaultValue={item?.due_date || ""}
                readOnly={member?.role === "operator"}
              />
            </label>
          </div>
        )}
        {["requests", "services"].includes(kind) && (
          <div className="form-grid">
            <label>
              Prioridade
              <select
                name="priority"
                aria-label="Prioridade"
                defaultValue={text(item?.data || {}, "priority") || "normal"}
              >
                {["low", "normal", "high", "urgent"].map((s) => (
                  <option value={s} key={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </label>
            {kind === "services" ? (
              <label>
                Local
                <input
                  name="location"
                  maxLength={180}
                  defaultValue={text(item?.data || {}, "location")}
                />
              </label>
            ) : (
              refField("Unidade (opcional)", "unit_id", "units")
            )}
          </div>
        )}
        {publication && (
          <>
            <label>
              Categoria
              <input
                name="category"
                defaultValue={text(item?.data || {}, "category")}
                maxLength={80}
                placeholder={
                  kind === "documents"
                    ? "Ex.: Atas, Regimento, Contratos"
                    : "Ex.: Manutenção, Segurança, Administração"
                }
              />
            </label>
            <label>
              Público-alvo
              <select
                name="audience"
                aria-label="Público-alvo"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="all">Todos os vínculos validados</option>
                <option value="blocks">Blocos selecionados</option>
                <option value="units">Unidades selecionadas</option>
              </select>
            </label>
            {audience !== "all" && (
              <fieldset>
                <legend>
                  {audience === "blocks" ? "Blocos" : "Unidades"} que receberão
                  a publicação
                </legend>
                {records
                  .filter((r) => r.kind === audience)
                  .map((r) => (
                    <label className="checkbox-label" key={r.id}>
                      <input
                        name="audience_ids"
                        value={r.id}
                        type="checkbox"
                        defaultChecked={
                          Array.isArray(item?.data.audience_ids) &&
                          item.data.audience_ids.includes(r.id)
                        }
                      />
                      {r.title}
                    </label>
                  ))}
                {!records.some((r) => r.kind === audience) && (
                  <p>
                    Cadastre {audience === "blocks" ? "blocos" : "unidades"}{" "}
                    antes de selecionar este público.
                  </p>
                )}
              </fieldset>
            )}
          </>
        )}
        {kind === "units" && refField("Bloco", "block_id", "blocks", true)}
        {kind === "people" && (
          <div className="form-grid">
            <label>
              E-mail
              <input
                name="email"
                type="email"
                defaultValue={text(item?.data || {}, "email")}
                maxLength={200}
              />
            </label>
            <label>
              Telefone
              <input
                name="phone"
                type="tel"
                defaultValue={text(item?.data || {}, "phone")}
                maxLength={30}
              />
            </label>
          </div>
        )}
        {kind === "unit_memberships" && (
          <>
            {refField("Unidade", "unit_id", "units", true)}
            {refField("Pessoa", "person_id", "people", true)}
            <label>
              Tipo de vínculo
              <select
                name="relationship"
                defaultValue={
                  text(item?.data || {}, "relationship") || "resident"
                }
              >
                {["owner", "resident", "authorized"].map((s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="validated"
                defaultChecked={item?.data.validated === true}
              />
              Vínculo conferido e validado pela administração
            </label>
            <p className="muted">
              A validação é registrada com data e autoria no histórico desta
              versão.
            </p>
          </>
        )}
        {kind === "checklist_templates" && (
          <label>
            Itens da rotina (um por linha)
            <textarea
              name="items"
              required
              rows={7}
              defaultValue={
                Array.isArray(item?.data.items)
                  ? item.data.items.join("\n")
                  : ""
              }
              placeholder={
                "Verificar iluminação das áreas comuns\nConferir limpeza dos acessos"
              }
            />
          </label>
        )}
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button" disabled={busy}>
            {busy
              ? "Salvando…"
              : item
                ? "Salvar nova versão"
                : "Salvar registro"}
            <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function SettingsPanel({
  state,
  condo,
  member,
  busy,
  mutate,
}: {
  state: State;
  condo: Condo | undefined;
  member: Member | undefined;
  busy: boolean;
  mutate: (body: unknown, success?: string) => Promise<unknown>;
}) {
  const [error, setError] = useState(""),
    [editing, setEditing] = useState<Member | null>(null),
    [audit, setAudit] = useState<
      | { id: string; action: string; created_at: string; actor_id: string }[]
      | null
    >(null);
  const permissionGroups = [
    ...modules.flatMap((m) => [
      m.key + ".read",
      m.key + ".write",
      m.key + ".read_all",
      ...(["announcements", "documents"].includes(m.key)
        ? [m.key + ".publish"]
        : []),
    ]),
    "members.read",
    "members.write",
    "settings.write",
    "reports.export",
    "audit.read",
    "approvals.read",
    "approvals.decide",
  ];
  return (
    <div className="settings-grid">
      <section className="panel settings-section">
        <h2>Conexão e privacidade</h2>
        <div
          className={`connection-state ${state.configured ? "connected" : ""}`}
        >
          <span className="live-dot" />
          {state.configured ? "Supabase configurado" : "Conexão pendente"}
        </div>
        <p>
          O aplicativo usa autenticação, banco e arquivos privados do seu
          projeto Supabase. Credenciais são configuradas no ambiente do
          servidor.
        </p>
        <ol className="setup-steps">
          <li>Crie um projeto Supabase e aplique a migração do repositório.</li>
          <li>
            Configure as variáveis públicas de URL e chave publicável, e a
            origem pública do app.
          </li>
          <li>
            Crie a primeira conta com e-mail confirmado e entre na Central.
          </li>
          <li>Crie o condomínio e conceda acesso à sua equipe.</li>
        </ol>
        <p className="muted">
          O guia completo está no README do projeto. Nunca coloque uma chave
          administrativa no navegador ou envie senhas no chat.
        </p>
      </section>
      <section className="panel settings-section">
        <h2>Regras do condomínio</h2>
        <p>
          Aprovações são opcionais. As decisões ficam vinculadas à versão exata
          do registro.
        </p>
        {condo ? (
          <form
            key={JSON.stringify(condo.settings)}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await mutate(
                  {
                    command: "settings",
                    condominium: condo.id,
                    settings: Object.fromEntries(
                      [
                        "announcement_approval",
                        "document_approval",
                        "service_approval",
                        "require_evidence",
                      ].map((k) => [k, f.get(k) === "on"]),
                    ),
                  },
                  "Regras atualizadas",
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {Object.entries({
              announcement_approval: "Exigir aprovação de comunicados",
              document_approval: "Exigir aprovação de documentos",
              service_approval: "Exigir aprovação da conclusão de serviços",
              require_evidence: "Exigir foto ou justificativa na conclusão",
            }).map(([key, label]) => (
              <label className="setting-toggle" key={key}>
                <span>{label}</span>
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={condo.settings[key]}
                  disabled={!can(member, "settings.write")}
                />
              </label>
            ))}
            <button
              className="button"
              disabled={busy || !can(member, "settings.write")}
            >
              Salvar regras
            </button>
          </form>
        ) : (
          <Empty title="Regras aguardando conexão" icon={Settings}>
            As opções ficam disponíveis para administradores autorizados.
          </Empty>
        )}
      </section>
      <section className="panel settings-section full-width">
        <div className="panel-heading">
          <div>
            <h2>Equipe e permissões</h2>
            <p>
              Concessões por ação, verificadas no servidor e no banco.
              Operadores acessam somente registros atribuídos, salvo concessão
              explícita.
            </p>
          </div>
        </div>
        {state.members.length ? (
          <div className="team-list">
            {state.members.map((m) => (
              <div key={m.user_id}>
                <span className="avatar">
                  {m.display_name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <strong>{m.display_name}</strong>
                  <small>
                    {labels[m.role]} ·{" "}
                    {m.permissions.includes("*")
                      ? "Acesso administrativo completo"
                      : `${m.permissions.length} permissões`}
                  </small>
                </span>
                {can(member, "members.write") &&
                  m.user_id !== state.user?.id && (
                    <button
                      className="button secondary small"
                      onClick={() => setEditing(m)}
                    >
                      Editar acesso
                    </button>
                  )}
                {can(member, "members.write") &&
                  m.user_id !== state.user?.id && (
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          !confirm(
                            "Revogar o acesso de " +
                              m.display_name +
                              " a este condomínio?",
                          )
                        )
                          return;
                        try {
                          await mutate(
                            {
                              command: "revoke",
                              condominium: condo?.id,
                              user: m.user_id,
                            },
                            "Acesso revogado",
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Revogar
                    </button>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhuma equipe carregada.</p>
        )}
        {can(member, "members.write") && (
          <form
            className="member-form"
            key={editing?.user_id || "new"}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await mutate(
                  {
                    command: "member",
                    condominium: condo?.id,
                    user: f.get("user"),
                    name: f.get("name"),
                    role: f.get("role"),
                    permissions: f.getAll("permissions"),
                  },
                  "Acesso da equipe atualizado",
                );
                setEditing(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <h3>
              {editing
                ? "Editar acesso de " + editing.display_name
                : "Adicionar conta existente à equipe"}
            </h3>
            <p className="muted">
              A conta deve ter sido criada no Supabase com e-mail confirmado.
              Use o UUID da conta; informar esse ID não concede acesso sem a sua
              autorização.
            </p>
            <div className="form-grid">
              <label>
                ID da conta (UUID)
                <input
                  name="user"
                  required
                  defaultValue={editing?.user_id}
                  readOnly={!!editing}
                  pattern="[0-9a-fA-F-]{36}"
                />
              </label>
              <label>
                Nome de identificação
                <input
                  name="name"
                  minLength={2}
                  required
                  defaultValue={editing?.display_name}
                />
              </label>
              <label>
                Papel
                <select name="role" defaultValue={editing?.role || "operator"}>
                  <option value="operator">Operador</option>
                  <option value="manager">Síndico</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
            </div>
            <fieldset className="permission-list">
              <legend>Permissões explícitas</legend>
              {permissionGroups.map((p) => (
                <label className="checkbox-label" key={p}>
                  <input
                    type="checkbox"
                    name="permissions"
                    value={p}
                    defaultChecked={
                      editing?.permissions.includes(p) ||
                      editing?.permissions.includes("*")
                    }
                  />
                  <span>{permissionLabel(p)}</span>
                </label>
              ))}
            </fieldset>
            <div className="form-actions">
              {editing && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setEditing(null)}
                >
                  Cancelar edição
                </button>
              )}
              <button className="button" disabled={busy}>
                Salvar acesso
              </button>
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="alert error">
            {error}
          </p>
        )}
      </section>
      {condo && can(member, "audit.read") && (
        <section className="panel settings-section full-width">
          <h2>Auditoria administrativa</h2>
          <p>
            Inclui alterações de equipe, regras, publicações e exportações. Até
            200 eventos recentes.
          </p>
          <button
            className="button secondary"
            onClick={async () => {
              try {
                const r = await request("/api/state?audit=" + condo.id);
                setAudit(r.events);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Consultar eventos recentes
          </button>
          {audit?.map((e) => (
            <div className="timeline" key={e.id}>
              <span className="timeline-dot" />
              <div>
                <strong>{eventLabel(e.action)}</strong>
                <p>
                  {state.members.find((m) => m.user_id === e.actor_id)
                    ?.display_name || e.actor_id}{" "}
                  · {dateLabel(e.created_at, true)}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
function permissionLabel(p: string) {
  const [module, action] = p.split(".");
  const noun =
    modules.find((m) => m.key === module)?.label ||
    (
      {
        members: "Equipe",
        settings: "Regras",
        reports: "Relatórios",
        audit: "Auditoria",
        approvals: "Aprovações",
      } as Record<string, string>
    )[module] ||
    module;
  return `${noun}: ${({ read: "consultar", write: "alterar", read_all: "consultar todos (operador)", publish: "publicar", export: "exportar", decide: "decidir" } as Record<string, string>)[action] || action}`;
}
