/* Standalone HTML demonstration. All state lives in memory; no API or production credentials. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const paths = {
    building:
      "M3 21V7h10v14M13 3h8v18M1 21h22M6 10h4M6 14h4M6 18h4M16 7h2M16 11h2M16 15h2",
    dashboard: "M3 3h7v8H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 15h7v6H3z",
    requests: "M9 4H5v17h14V4h-4M9 2h6v4H9zM8 11h8M8 15h5",
    services: "M14 6a5 5 0 0 0-6 6L2 18l4 4 6-6a5 5 0 0 0 6-6l-3 3-4-4z",
    announcements: "M3 10v5h4l10 5V5L7 10zM7 15l2 6M21 9v7",
    documents: "M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h6",
    checklist: "M9 5h12M9 12h12M9 19h12M2 4l2 2 3-3M2 11l2 2 3-3M2 18l2 2 3-3",
    people:
      "M15 21v-3a5 5 0 0 0-10 0v3M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 3a4 4 0 0 1 0 8M19 14a4 4 0 0 1 3 4v3",
    shield: "M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6zM8 12l3 3 5-6",
    report: "M3 3v18h19M7 16v-5M12 16V6M17 16V9",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 2h6l1 4 4 1 2 5-3 3v4l-5 3-3-3-4 1-4-5 2-4-1-4z",
    chevron: "m9 5 7 7-7 7",
    plus: "M12 5v14M5 12h14",
    close: "m6 6 12 12M6 18 18 6",
    menu: "M3 5h18M3 12h18M3 19h18",
    search: "M21 21l-6-6M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14",
    check: "m5 12 4 4L20 5",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v6l4 2",
    info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v6M12 7v1",
    arrow: "M6 18 18 6M7 6h11v11",
    file: "M8 13v-7a4 4 0 0 1 8 0v11a6 6 0 0 1-12 0V8M12 6v11a2 2 0 0 1-4 0",
    download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
    refresh: "M20 7a9 9 0 1 0 1 9M20 2v6h-6",
    link: "m9 15 6-6M8 17l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 7l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0",
  };
  function icon(name, size = 19) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.building}"/></svg>`;
  }
  $$("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  const modules = [
    [
      "requests",
      "Solicitações",
      "solicitação",
      "requests",
      "Do primeiro contato à resolução, com cada passo registrado.",
    ],
    [
      "services",
      "Serviços",
      "serviço",
      "services",
      "Responsáveis, prazos e evidências para acompanhar a execução.",
    ],
    [
      "announcements",
      "Comunicados",
      "comunicado",
      "announcements",
      "Publique para o público certo e acompanhe os eventos reais.",
    ],
    [
      "documents",
      "Documentos",
      "documento",
      "documents",
      "Atas, regimento e arquivos, com cada versão preservada.",
    ],
    [
      "checklist_runs",
      "Checklist diário",
      "execução",
      "checklist",
      "O que foi feito, por quem e em qual horário.",
    ],
    [
      "checklist_templates",
      "Modelos de checklist",
      "modelo",
      "checklist",
      "Defina a rotina e gere uma execução independente por dia.",
    ],
    [
      "units",
      "Unidades",
      "unidade",
      "building",
      "Organize os espaços, blocos e vínculos do condomínio.",
    ],
    [
      "blocks",
      "Blocos",
      "bloco",
      "building",
      "A estrutura do condomínio em uma visão simples.",
    ],
    [
      "people",
      "Pessoas",
      "pessoa",
      "people",
      "Proprietários, moradores e contatos autorizados.",
    ],
    [
      "unit_memberships",
      "Vínculos",
      "vínculo",
      "link",
      "Pessoas e unidades relacionadas, com validação explícita.",
    ],
  ].map(([key, label, singular, icon, description]) => ({
    key,
    label,
    singular,
    icon,
    description,
  }));
  const labels = {
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
    approved: "Aprovado",
    rejected: "Revisão solicitada",
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
  const members = [
    { id: "admin", name: "Administração (exemplo)", role: "admin" },
    { id: "manager", name: "Síndico (exemplo)", role: "manager" },
    { id: "op1", name: "Manutenção (exemplo)", role: "operator" },
    { id: "op2", name: "Limpeza (exemplo)", role: "operator" },
  ];
  const dayFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = () => dayFormat.format(new Date());
  const day = (offset = 0) => {
    const d = new Date(today() + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const now = () => new Date().toISOString();
  const displayDate = (value, time = false) =>
    value
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          ...(time ? { timeStyle: "short" } : {}),
        }).format(new Date(value.length === 10 ? value + "T12:00:00Z" : value))
      : "Sem prazo";
  const memberName = (id) =>
    members.find((m) => m.id === id)?.name || "Não atribuído";
  const badge = (s) =>
    `<span class="badge badge-${esc(s)}">${esc(labels[s] || s)}</span>`;
  const btn = (label, attrs = "", secondary = false) =>
    `<button type="button" class="button ${secondary ? "secondary" : ""}" ${attrs}>${label}</button>`;
  const empty = (title, body, i = "requests") =>
    `<div class="empty"><span class="empty-icon">${icon(i, 28)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
  const recordName = (id) =>
    state.records.find((r) => r.id === id)?.title || "Não informado";
  let state,
    current = "dashboard",
    profile = "admin",
    search = "",
    filter = "",
    assigned = "",
    blockFilter = "",
    from = "",
    to = "",
    toastTimer,
    serial = 100;
  let modalContext = null;
  const objectUrls = new Set();
  const actor = () => (profile === "manager" ? "manager" : "admin");
  function snapshot(r) {
    r.versions.push({
      revision: r.revision,
      title: r.title,
      status: r.status,
      data: clone(r.data),
      files: r.files.map((f) => ({ ...f })),
      at: now(),
      by: actor(),
    });
  }
  function audit(r, action, detail = "") {
    const event = {
      id: "ev-" + ++serial,
      record: r?.id || null,
      title: r?.title || "Configuração",
      action,
      detail,
      by: actor(),
      at: now(),
    };
    state.audit.unshift(event);
    if (r) r.history.unshift(event);
  }
  function changed(r, action, detail = "") {
    r.revision++;
    r.updated = now();
    snapshot(r);
    audit(r, action, detail);
  }
  function seed() {
    state = {
      records: [],
      audit: [],
      approvals: [],
      rules: {
        announcement_approval: true,
        document_approval: false,
        service_approval: false,
        require_evidence: true,
      },
      permissions: { managerEdit: false, export: true },
    };
    function add(
      id,
      kind,
      title,
      status,
      data = {},
      assignedTo = "",
      due = "",
    ) {
      const r = {
        id,
        kind,
        title,
        status,
        data,
        assigned: assignedTo,
        due,
        created: new Date(day(-3) + "T12:00:00Z").toISOString(),
        updated: now(),
        revision: 1,
        files: [],
        history: [],
        versions: [],
        messages: [],
      };
      state.records.push(r);
      snapshot(r);
      audit(r, "Registro de demonstração criado");
      return r;
    }
    add("b-a", "blocks", "Bloco A", "active", {
      description: "Bloco residencial — exemplo fictício",
    });
    add("b-b", "blocks", "Bloco B", "active", {
      description: "Bloco residencial — exemplo fictício",
    });
    for (const [id, title, block] of [
      ["u101", "101", "b-a"],
      ["u102", "102", "b-a"],
      ["u201", "201", "b-b"],
      ["u202", "202", "b-b"],
    ])
      add(id, "units", "Unidade " + title, "active", {
        block_id: block,
        description: "Unidade ilustrativa",
      });
    add("p1", "people", "Pessoa de exemplo 1", "active", {
      email: "pessoa1@example.invalid",
      phone: "Não informado",
    });
    add("p2", "people", "Pessoa de exemplo 2", "active", {
      email: "pessoa2@example.invalid",
      phone: "Não informado",
    });
    add("v1", "unit_memberships", "Vínculo de exemplo 1", "active", {
      person_id: "p1",
      unit_id: "u101",
      relationship: "owner",
      validated: true,
    });
    add("v2", "unit_memberships", "Vínculo de exemplo 2", "active", {
      person_id: "p1",
      unit_id: "u201",
      relationship: "owner",
      validated: true,
    });
    add("v3", "unit_memberships", "Vínculo aguardando validação", "active", {
      person_id: "p2",
      unit_id: "u102",
      relationship: "resident",
      validated: false,
    });
    add(
      "r1",
      "requests",
      "Iluminação do acesso ao Bloco A",
      "open",
      {
        description: "Exemplo: ponto de iluminação precisa de inspeção.",
        priority: "high",
        unit_id: "u101",
        category: "Manutenção",
      },
      "op1",
      day(),
    );
    add(
      "r2",
      "requests",
      "Ruído na porta de acesso",
      "in_progress",
      {
        description: "Exemplo: verificar fechamento e regulagem.",
        priority: "normal",
        unit_id: "u201",
        category: "Manutenção",
      },
      "op1",
      day(1),
    );
    add(
      "r3",
      "requests",
      "Informação sobre o regimento",
      "waiting",
      {
        description: "Exemplo: aguardando detalhes da dúvida.",
        priority: "normal",
        unit_id: "u102",
        category: "Administração",
      },
      "admin",
      day(2),
    );
    add(
      "r4",
      "requests",
      "Limpeza de área comum",
      "resolved",
      {
        description: "Exemplo de atendimento encerrado.",
        priority: "low",
        unit_id: "u202",
        category: "Limpeza",
      },
      "op2",
      day(-1),
    );
    add(
      "s1",
      "services",
      "Inspecionar iluminação do acesso",
      "todo",
      {
        description: "Exemplo: conferir o circuito e registrar a inspeção.",
        location: "Acesso do Bloco A",
        priority: "high",
        source_request_id: "r1",
      },
      "op1",
      day(),
    );
    add(
      "s2",
      "services",
      "Revisar fechamento do portão",
      "in_progress",
      {
        description: "Exemplo: verificar a regulagem do fechamento.",
        location: "Portaria",
        priority: "normal",
        source_request_id: "r2",
      },
      "op1",
      day(),
    );
    add(
      "s3",
      "services",
      "Higienização do salão",
      "done",
      {
        description: "Exemplo de serviço concluído, sem despesa associada.",
        location: "Salão de uso comum",
        priority: "normal",
      },
      "op2",
      day(),
    );
    const a = add(
      "a1",
      "announcements",
      "Inspeção preventiva das áreas comuns",
      "pending",
      {
        body: "Comunicado de demonstração: uma inspeção preventiva está em planejamento. Este texto não será enviado a ninguém.",
        category: "Manutenção",
        priority: "normal",
        audience: "all",
        audience_ids: [],
      },
    );
    state.approvals.push({
      id: "ap1",
      record: a.id,
      revision: 1,
      status: "pending",
      by: "admin",
      at: now(),
    });
    add(
      "a2",
      "announcements",
      "Orientações para uso das áreas comuns",
      "published",
      {
        body: "Exemplo fictício de comunicado publicado. A publicação demonstrativa não representa envio ou confirmação de leitura.",
        category: "Convivência",
        priority: "normal",
        audience: "blocks",
        audience_ids: ["b-a"],
        recipients: [{ person: "p1", unit: "u101" }],
        publishedRevision: 1,
      },
    );
    add("a3", "announcements", "Aviso em elaboração", "draft", {
      body: "Rascunho ilustrativo. Edite e experimente o fluxo de aprovação.",
      category: "Administração",
      priority: "urgent",
      audience: "all",
      audience_ids: [],
    });
    const doc = add(
      "d1",
      "documents",
      "Regimento interno — exemplo",
      "published",
      {
        description:
          "Documento ilustrativo. Nenhum regimento real foi carregado.",
        category: "Regimento",
        audience: "all",
        audience_ids: [],
        recipients: [
          { person: "p1", unit: "u101" },
          { person: "p1", unit: "u201" },
        ],
        publishedRevision: 1,
      },
    );
    doc.files.push({
      id: "demo-pdf",
      name: "Regimento demonstrativo.pdf",
      category: "attachment",
      demo: true,
      size: 0,
    });
    doc.versions = [];
    snapshot(doc);
    add("d2", "documents", "Ata de reunião — rascunho", "draft", {
      description:
        "Adicione um arquivo para experimentar o fluxo de publicação.",
      category: "Atas",
      audience: "all",
      audience_ids: [],
    });
    add(
      "t1",
      "checklist_templates",
      "Ronda das áreas comuns",
      "active",
      {
        items: [
          "Verificar iluminação dos acessos",
          "Conferir limpeza das áreas comuns",
          "Verificar portas e portões",
        ],
      },
      "op1",
    );
    add(
      "t2",
      "checklist_templates",
      "Rotina de limpeza",
      "active",
      {
        items: [
          "Conferir materiais de apoio",
          "Verificar limpeza do hall",
          "Registrar observações da rotina",
        ],
      },
      "op2",
    );
    add(
      "c1",
      "checklist_runs",
      "Ronda das áreas comuns",
      "in_progress",
      {
        template_id: "t1",
        template_revision: 1,
        day: today(),
        items: [
          {
            label: "Verificar iluminação dos acessos",
            done: true,
            by: "op1",
            at: now(),
            note: "Exemplo de verificação registrada",
          },
          { label: "Conferir limpeza das áreas comuns", done: false },
          { label: "Verificar portas e portões", done: false },
        ],
      },
      "op1",
      day(),
    );
    state.audit = state.audit.slice(0, 12);
    profile = "admin";
    $("#profile").value = "admin";
    serial = 200;
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $("#toast").textContent = message;
    $("#toast").hidden = false;
    toastTimer = setTimeout(() => ($("#toast").hidden = true), 5500);
  }
  function canEdit() {
    return profile === "admin" || state.permissions.managerEdit;
  }
  function setMenu(open) {
    $("#sidebar").classList.toggle("is-open", open);
    $("#overlay").hidden = !open;
    $("#menu").setAttribute("aria-expanded", String(open));
  }
  function closeModal() {
    $("#dialog").close();
    modalContext = null;
  }
  function modal(title, body, context = {}) {
    $("#dialog-title").textContent = title;
    $("#dialog-body").innerHTML = body;
    modalContext = context;
    if (!$("#dialog").open) $("#dialog").showModal();
  }
  const notice =
    '<div class="callout">Demonstração: nada será enviado ou gravado no Supabase. Não use informações pessoais reais.</div>';
  function go(view, status = "") {
    const exists =
      view === "dashboard" ||
      view === "approvals" ||
      view === "reports" ||
      view === "settings" ||
      view === "materials" ||
      modules.some((m) => m.key === view);
    current = exists ? view : "dashboard";
    filter = status;
    search = "";
    assigned = "";
    blockFilter = "";
    from = "";
    to = "";
    const hash =
      "#" + current + (status ? "?status=" + encodeURIComponent(status) : "");
    history.replaceState(null, "", hash);
    setMenu(false);
    closeModal();
    render();
    $("#page-title").scrollIntoView({ block: "nearest" });
  }
  function nav() {
    const entries = [
      { key: "dashboard", label: "Visão geral", icon: "dashboard" },
      ...modules.slice(0, 6),
      { key: "approvals", label: "Aprovações", icon: "shield" },
      ...modules.slice(6),
      { key: "reports", label: "Relatórios e auditoria", icon: "report" },
      { key: "materials", label: "Custos e materiais", icon: "building" },
      { key: "settings", label: "Configurações", icon: "settings" },
    ];
    $("#navigation").innerHTML = entries
      .map(
        (m) =>
          `<button type="button" class="nav-item ${current === m.key ? "active" : ""}" data-view="${m.key}" ${current === m.key ? 'aria-current="page"' : ""}>${icon(m.icon)}<span>${m.label}</span>${m.key === "materials" ? '<span class="soon">Futuro</span>' : m.key === "approvals" ? `<span class="nav-count">${state.approvals.filter((a) => a.status === "pending").length}</span>` : ""}</button>`,
      )
      .join("");
  }
  function option(value, label, selected) {
    return `<option value="${esc(value)}" ${String(value) === String(selected) ? "selected" : ""}>${esc(label)}</option>`;
  }
  function filterControls() {
    const source = modules.some((m) => m.key === current)
      ? state.records.filter((r) => r.kind === current)
      : state.records;
    return `<div class="filters"><label class="search-input">${icon("search", 17)}<input id="search" aria-label="Buscar registros" placeholder="Buscar por título ou descrição…" value="${esc(search)}"></label><select id="status-filter" aria-label="Filtrar por status">${option("", "Todos os status", filter)}${[...new Set(source.map((r) => r.status))].map((s) => option(s, labels[s], filter)).join("")}${filter === "overdue" ? option("overdue", "Atrasados", filter) : ""}</select><select id="assigned-filter" aria-label="Filtrar por responsável">${option("", "Todos os responsáveis", assigned)}${members.map((m) => option(m.id, m.name, assigned)).join("")}</select><select id="block-filter" aria-label="Filtrar por bloco">${option("", "Todos os blocos", blockFilter)}${state.records
      .filter((r) => r.kind === "blocks")
      .map((r) => option(r.id, r.title, blockFilter))
      .join(
        "",
      )}</select><label class="date-filter">De<input id="from-filter" aria-label="Data inicial" type="date" value="${esc(from)}"></label><label class="date-filter">Até<input id="to-filter" aria-label="Data final" type="date" value="${esc(to)}"></label><button class="text-button" data-clear>Limpar filtros</button></div>`;
  }
  function filtered(kind = "") {
    return state.records.filter(
      (r) =>
        (!kind || r.kind === kind) &&
        (!search ||
          (r.title + " " + (r.data.description || r.data.body || ""))
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR"))) &&
        (!filter ||
          (filter === "overdue"
            ? r.due &&
              r.due < today() &&
              !["done", "resolved", "cancelled"].includes(r.status)
            : r.status === filter)) &&
        (!assigned || r.assigned === assigned) &&
        (!from || dayFormat.format(new Date(r.created)) >= from) &&
        (!to || dayFormat.format(new Date(r.created)) <= to) &&
        (!blockFilter ||
          r.data.block_id === blockFilter ||
          state.records.some(
            (u) => u.id === r.data.unit_id && u.data.block_id === blockFilter,
          )),
    );
  }
  function table(rows) {
    return `<div class="table-scroll table-desktop"><table><thead><tr><th>Registro</th><th>Status</th><th>Responsável</th><th>Prazo</th><th><span class="sr-only">Detalhes</span></th></tr></thead><tbody>${rows.map((r) => `<tr><td><button class="table-title" data-open="${esc(r.id)}">${esc(r.title)}<small>${esc(modules.find((m) => m.key === r.kind)?.label)} · ${esc(r.id.toUpperCase())}</small></button></td><td>${badge(r.status)}</td><td>${esc(memberName(r.assigned))}</td><td>${esc(displayDate(r.due))}</td><td><button class="icon-button" data-open="${esc(r.id)}" aria-label="Detalhes de ${esc(r.title)}">${icon("chevron", 17)}</button></td></tr>`).join("")}</tbody></table></div><div class="mobile-card-list">${rows.map((r) => `<button class="mobile-record" data-open="${esc(r.id)}"><div>${badge(r.status)}${icon("chevron", 16)}</div><strong>${esc(r.title)}</strong><div><small>${esc(memberName(r.assigned))}</small><small>${esc(displayDate(r.due))}</small></div></button>`).join("")}</div>${rows.length ? "" : empty("Nenhum registro encontrado", "Ajuste os filtros ou crie um registro de demonstração.")}`;
  }
  function dashboard() {
    const requests = state.records.filter((r) => r.kind === "requests"),
      services = state.records.filter((r) => r.kind === "services");
    const cards = [
      [
        "Solicitações abertas",
        requests.filter((r) => r.status === "open").length,
        "requests",
        "open",
        "requests",
        "blue",
      ],
      [
        profile === "manager"
          ? "Solicitações atrasadas"
          : "Aguardando informação",
        requests.filter((r) =>
          profile === "manager"
            ? r.due &&
              r.due < today() &&
              !["resolved", "cancelled"].includes(r.status)
            : r.status === "waiting",
        ).length,
        "requests",
        profile === "manager" ? "overdue" : "waiting",
        "clock",
        "amber",
      ],
      [
        "Serviços em andamento",
        services.filter((r) => r.status === "in_progress").length,
        "services",
        "in_progress",
        "services",
        "teal",
      ],
      [
        "Aprovações pendentes",
        state.approvals.filter((a) => a.status === "pending").length,
        "approvals",
        "",
        "shield",
        "violet",
      ],
    ];
    const active = services.filter(
      (r) => !["done", "cancelled"].includes(r.status),
    );
    return `<div class="section-heading"><h2>O que precisa da sua atenção</h2><span>Exemplos fictícios · ${displayDate(today())}</span></div><div class="metrics">${cards.map(([label, value, target, status, i, tone]) => `<button class="metric ${tone}" data-view="${target}" data-filter="${status}"><span class="metric-top">${label}${icon(i)}</span><strong>${value}</strong><span class="metric-bottom">Consultar registros ${icon("arrow", 15)}</span></button>`).join("")}</div><div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h2>Solicitações por status</h2><p>Distribuição dos registros de demonstração</p></div><span class="subtle-tag">Atendimento</span></div><div class="status-chart">${[
      "open",
      "in_progress",
      "waiting",
      "resolved",
      "cancelled",
    ]
      .map((s) => {
        const n = requests.filter((r) => r.status === s).length;
        return `<button data-view="requests" data-filter="${s}"><span>${labels[s]}</span><span class="chart-track"><span style="width:${requests.length ? (n / requests.length) * 100 : 0}%"></span></span><strong>${n}</strong></button>`;
      })
      .join(
        "",
      )}</div></section><section class="panel daily-panel"><div class="panel-heading"><div><h2>A operação de hoje</h2><p>${displayDate(today())} · exemplos de rotina</p></div><span class="daily-icon">${icon("checklist")}</span></div><div class="daily-stat"><span>Serviços com prazo hoje</span><strong>${services.filter((r) => r.due === today()).length}</strong></div><div class="daily-stat"><span>Serviços concluídos hoje</span><strong>${services.filter((r) => r.status === "done" && dayFormat.format(new Date(r.updated)) === today()).length}</strong></div><div class="daily-stat"><span>Checklists pendentes hoje</span><strong>${state.records.filter((r) => r.kind === "checklist_runs" && r.due === today() && r.status !== "done").length}</strong></div><button class="text-button" data-view="checklist_runs">Abrir checklist diário ${icon("chevron", 16)}</button></section></div><div class="dashboard-links">${[
      ["requests", "Nova solicitação", "Registre e acompanhe um atendimento."],
      [
        "services",
        "Organizar serviços",
        "Veja prazos e responsáveis no quadro.",
      ],
      [
        "announcements",
        "Comunicar com clareza",
        "Confira o público e as publicações.",
      ],
    ]
      .map(
        ([v, t, d]) =>
          `<button class="shortcut" data-view="${v}">${icon(modules.find((m) => m.key === v).icon, 24)}<span><strong>${t}</strong><small>${d}</small></span><span>${icon("chevron", 17)}</span></button>`,
      )
      .join(
        "",
      )}</div><section class="panel"><div class="panel-heading"><div><h2>Próximos passos da gestão</h2><p>Todos os serviços abaixo são exemplos para explorar a interface.</p></div><button class="text-button" data-view="services">Ver quadro ${icon("chevron", 15)}</button></div>${table(active)}</section><section class="panel section-space"><div class="panel-heading"><div><h2>Evolução do atendimento</h2><p>Solicitações de demonstração por dia de criação</p></div></div><div class="trend-chart">${Array.from(
      { length: 7 },
      (_, n) => {
        const key = day(n - 6),
          count = requests.filter(
            (r) => dayFormat.format(new Date(r.created)) === key,
          ).length;
        return `<div><strong>${count}</strong><span class="trend-track"><span style="height:${Math.min(100, (count / Math.max(1, requests.length)) * 100)}%"></span></span><small>${key.slice(8)}/${key.slice(5, 7)}</small></div>`;
      },
    ).join(
      "",
    )}</div></section><div class="footnote">${icon("shield", 16)}Nenhum envio externo, pagamento ou alteração no banco é realizado nesta versão HTML.</div>`;
  }
  function listScreen() {
    const rows = filtered(current);
    let body = "";
    if (current === "services") {
      body = `<div class="kanban">${[
        "todo",
        "in_progress",
        "pending",
        "done",
        "cancelled",
      ]
        .map(
          (s) =>
            `<section class="kanban-column"><h2><span class="status-dot ${s}"></span>${labels[s]}<span>${rows.filter((r) => r.status === s).length}</span></h2>${rows
              .filter((r) => r.status === s)
              .map(
                (r) =>
                  `<button class="service-card" data-open="${r.id}">${badge(r.data.priority || "normal")}<strong>${esc(r.title)}</strong><p>${esc(r.data.location || "Local não informado")}</p><footer><span>${esc(memberName(r.assigned))}</span><span>${icon("clock", 13)}${displayDate(r.due)}</span></footer></button>`,
              )
              .join(
                "",
              )}${rows.some((r) => r.status === s) ? "" : '<p class="kanban-empty">Nenhum serviço</p>'}</section>`,
        )
        .join("")}</div>`;
    } else if (["announcements", "documents"].includes(current)) {
      body = `<div class="card-grid">${rows.map((r) => `<article class="panel publication-card">${current === "documents" ? `<span class="document-icon">${icon("documents", 25)}</span>` : ""}${badge(r.status)}<h2>${esc(r.title)}</h2><p>${esc(String(r.data.body || r.data.description || "Sem descrição.").slice(0, 150))}</p>${r.data.priority === "urgent" ? '<div class="urgent-note">Urgente · envio externo não configurado</div>' : ""}<div class="card-meta"><span>${esc(r.data.category || "Geral")}</span><span>Versão ${r.revision}</span></div>${btn("Ver detalhes", `data-open="${r.id}"`, true)}</article>`).join("")}</div>${rows.length ? "" : empty("Nenhuma publicação neste filtro", "Crie um rascunho ou ajuste a busca.", current)}`;
    } else if (current === "units") {
      body = `<div class="unit-grid">${rows.map((r) => `<button class="unit-card" data-open="${r.id}">${icon("building", 23)}<strong>${esc(r.title)}</strong><span>${esc(recordName(r.data.block_id))}</span><p class="demo-note">${state.records.filter((l) => l.kind === "unit_memberships" && l.data.unit_id === r.id).length} vínculos cadastrados</p></button>`).join("")}</div>${rows.length ? "" : empty("Nenhuma unidade encontrada", "Cadastre um bloco e depois suas unidades.", "building")}`;
    } else if (["checklist_runs", "checklist_templates"].includes(current)) {
      body = `<div class="card-grid">${rows
        .map((r) => {
          const items = r.data.items || [],
            done = items.filter((i) => i.done).length;
          return `<article class="panel publication-card">${badge(r.status)}<h2>${esc(r.title)}</h2><p>${esc(memberName(r.assigned))}</p>${current === "checklist_runs" ? `<div class="routine-progress"><span style="width:${items.length ? (done / items.length) * 100 : 0}%"></span></div><p>${done} de ${items.length} itens concluídos · ${displayDate(r.due)}</p>` : `<p>${items.length} itens no modelo</p>`}${btn(current === "checklist_runs" ? "Abrir execução" : "Ver modelo", `data-open="${r.id}"`, true)}</article>`;
        })
        .join(
          "",
        )}</div>${rows.length ? "" : empty("Nenhum checklist encontrado", "Gere a execução a partir de um modelo de checklist.", "checklist")}`;
    } else
      body = `<section class="panel"><div class="list-summary"><strong>${rows.length} registros</strong><span>Selecione para ver detalhes</span></div>${table(rows)}</section>`;
    return filterControls() + `<div id="results">${body}</div>`;
  }
  function approvalScreen() {
    const pending = state.approvals.filter((a) => a.status === "pending");
    return `<div class="read-only-note">Na demonstração, use a prévia de síndico para decidir aprovações solicitadas pela administração. Essa troca visual não é autenticação.</div><section class="panel"><div class="panel-heading"><div><h2>Fila de decisões</h2><p>Autor, justificativa e versão ficam registrados no histórico demonstrativo.</p></div>${icon("shield", 25)}</div>${pending
      .map((a) => {
        const r = state.records.find((r) => r.id === a.record);
        return `<button class="approval-row" data-open="${esc(a.record)}"><span><strong>${esc(r?.title || "Registro")}</strong><small>${esc(memberName(a.by))} · versão ${a.revision} · ${displayDate(a.at, true)}</small></span>${badge(a.status)}${icon("chevron", 18)}</button>`;
      })
      .join(
        "",
      )}${pending.length ? "" : empty("Nenhuma aprovação pendente", "Ative uma regra em Configurações e publique um rascunho.", "shield")}</section><section class="panel section-space"><div class="panel-heading"><h2>Decisões anteriores</h2></div>${
      state.approvals
        .filter((a) => a.status !== "pending")
        .map(
          (a) =>
            `<div class="approval-row"><span><strong>${esc(recordName(a.record))}</strong><small>${esc(a.reason || "Versão substituída por edição")} · ${esc(memberName(a.decidedBy))}</small></span>${badge(a.status)}</div>`,
        )
        .join("") ||
      '<p class="no-data">Nenhuma decisão registrada nesta demonstração.</p>'
    }</section>`;
  }
  function reports() {
    const rows = filtered();
    return (
      filterControls() +
      `<div class="report-summary"><section class="panel"><strong>${rows.filter((r) => r.kind === "requests").length}</strong><p>Solicitações no filtro</p></section><section class="panel"><strong>${rows.filter((r) => r.kind === "services" && r.status === "done").length}</strong><p>Serviços concluídos no filtro</p></section><section class="panel"><strong>${rows.filter((r) => r.kind === "announcements" && r.status === "published").length}</strong><p>Comunicados publicados no filtro</p></section></div><section class="panel"><div class="panel-heading"><div><h2>Registros com origem verificável</h2><p>Filtros por data de criação, status, bloco e responsável.</p></div>${btn(icon("download", 16) + "Exportar exemplos em CSV", "data-export", true)}</div>${table(rows)}</section><section class="panel section-space"><div class="panel-heading"><div><h2>Auditoria da demonstração</h2><p>Eventos desta aba. O histórico definitivo depende do backend.</p></div></div><div class="detail-content audit-list">${historyList(state.audit)}</div></section>`
    );
  }
  function settings() {
    const rules = {
      announcement_approval: "Exigir aprovação de comunicados",
      document_approval: "Exigir aprovação de documentos",
      service_approval: "Exigir aprovação da conclusão de serviços",
      require_evidence: "Exigir foto ou justificativa na conclusão",
    };
    return `<div class="settings-grid"><section class="panel settings-section"><h2>Regras de operação</h2><p>Experimente as regras nos registros desta aba. Não altera o condomínio de produção.</p><form id="rules-form">${Object.entries(
      rules,
    )
      .map(
        ([k, label]) =>
          `<label class="setting-toggle"><span>${label}</span><input type="checkbox" name="${k}" ${state.rules[k] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}<button class="button" type="submit">Salvar regras de demonstração</button></form></section><section class="panel settings-section"><h2>Acesso ao ambiente real</h2><div class="connection-state">${icon("info", 15)}HTML de demonstração · sem conexão</div><p>Esta versão abre diretamente no navegador e no GitHub Pages. O backend Next.js/Supabase permanece no mesmo repositório.</p><ol class="setup-steps"><li>Aplicar a migração no projeto Supabase.</li><li>Configurar URL e chave publicável no ambiente do app Next.js.</li><li>Publicar o app Next.js em uma hospedagem compatível.</li><li>Validar login, permissões e arquivos privados.</li></ol><p class="demo-note">Não insira chaves ou senhas nesta página HTML. Nenhuma sessão de Supabase é criada pela prévia de perfil.</p></section><section class="panel settings-section full-width"><h2>Equipe e matriz de acesso</h2><p>Contas fictícias para apresentar os perfis e a atribuição de trabalho.</p><div class="team-list">${members.map((m) => `<div><span class="avatar">${esc(m.name.slice(0, 2).toUpperCase())}</span><span><strong>${esc(m.name)}</strong><small>${esc(labels[m.role])}</small></span>${btn("Ver permissões", `data-member="${m.id}"`, true)}</div>`).join("")}</div><form id="permissions-form"><label class="setting-toggle"><span>Permitir edição para o síndico nesta demonstração</span><input type="checkbox" name="managerEdit" ${state.permissions.managerEdit ? "checked" : ""}></label><label class="setting-toggle"><span>Permitir exportação CSV nesta demonstração</span><input type="checkbox" name="export" ${state.permissions.export ? "checked" : ""}></label><button class="button" type="submit">Salvar prévia de permissões</button></form><p class="demo-note">Em produção, as regras são verificadas no servidor e no banco. Esconder ou exibir botões não concede autorização.</p></section></div>`;
  }
  function render() {
    nav();
    const m = modules.find((m) => m.key === current);
    const title =
      m?.label ||
      {
        dashboard: profile === "manager" ? "Visão do síndico" : "Visão geral",
        approvals: "Aprovações",
        reports: "Relatórios e auditoria",
        settings: "Configurações",
        materials: "Custos e materiais",
      }[current];
    $("#breadcrumb-title").textContent = title;
    $("#page-title").textContent = title;
    $("#profile-label").textContent =
      profile === "manager" ? "Prévia do síndico" : "Administração e operação";
    $("#avatar").textContent = profile === "manager" ? "SI" : "AD";
    $("#page-description").textContent =
      m?.description ||
      {
        dashboard: "Todas as operações do condomínio, em uma central.",
        approvals: "Decisões vinculadas à versão exata de cada registro.",
        reports: "Números calculados sobre os exemplos desta aba.",
        settings: "Experimente regras e conheça os perfis de acesso.",
        materials: "Integração futura com o Almox Aqua.",
      }[current];
    $("#heading-actions").innerHTML =
      (m && current !== "checklist_runs" && canEdit()
        ? btn(icon("plus", 16) + "Novo registro", `data-new="${current}"`)
        : current === "checklist_runs"
          ? btn("Ver modelos", 'data-view="checklist_templates"', true)
          : "") +
      (current === "dashboard"
        ? btn(icon("refresh", 15) + "Atualizar tela", "data-refresh", true)
        : "");
    $("#screen").innerHTML =
      (profile === "manager" && !canEdit() && m
        ? '<div class="read-only-note">Prévia do síndico com leitura e aprovações. Edição pode ser concedida em Configurações.</div>'
        : "") +
      (current === "dashboard"
        ? dashboard()
        : current === "approvals"
          ? approvalScreen()
          : current === "reports"
            ? reports()
            : current === "settings"
              ? settings()
              : current === "materials"
                ? `<section class="panel">${empty("Integração ainda não ativada", "Custos e materiais serão integrados ao Almox Aqua em uma fase futura. Nenhum valor ou movimentação fictícia é tratado como dado financeiro.", "building")}</section>`
                : listScreen());
  }
  function field(label, name, value = "", type = "text", extra = "") {
    return `<label>${esc(label)}<input type="${type}" name="${name}" value="${esc(value)}" ${extra}></label>`;
  }
  function selectField(label, name, values, value = "", required = false) {
    return `<label>${esc(label)}<select aria-label="${esc(label)}" name="${name}" ${required ? "required" : ""}>${option("", "Selecione", value)}${values.map(([v, l]) => option(v, l, value)).join("")}</select></label>`;
  }
  function refField(label, name, kind, value = "", required = false) {
    return selectField(
      label,
      name,
      state.records.filter((r) => r.kind === kind).map((r) => [r.id, r.title]),
      value,
      required,
    );
  }
  function audienceOptions(type, ids = []) {
    return type === "all"
      ? '<p class="demo-note">Inclui todos os vínculos validados no momento da publicação.</p>'
      : `<fieldset><legend>${type === "blocks" ? "Blocos" : "Unidades"} selecionados</legend>${
          state.records
            .filter((r) => r.kind === type)
            .map(
              (r) =>
                `<label class="checkbox-label"><input type="checkbox" name="audience_ids" value="${r.id}" ${ids.includes(r.id) ? "checked" : ""}>${esc(r.title)}</label>`,
            )
            .join("") ||
          '<p class="demo-note">Cadastre registros para selecionar este público.</p>'
        }</fieldset>`;
  }
  function editor(kind, id) {
    if (!canEdit()) {
      toast("Esta prévia de perfil não possui edição. Veja Configurações.");
      return;
    }
    const meta = modules.find((m) => m.key === kind),
      r = state.records.find((r) => r.id === id),
      d = r?.data || {};
    let fields = field(
      kind === "people"
        ? "Nome completo"
        : kind === "units"
          ? "Identificação da unidade"
          : kind === "blocks"
            ? "Nome do bloco"
            : "Título",
      "title",
      r?.title || "",
      "text",
      'required minlength="2" maxlength="180"',
    );
    if (kind === "announcements")
      fields += `<label>Texto do comunicado<textarea name="body" rows="6" required maxlength="20000">${esc(d.body || "")}</textarea></label>`;
    else if (!["people", "blocks", "unit_memberships"].includes(kind))
      fields += `<label>Descrição<textarea name="description" rows="4" maxlength="5000">${esc(d.description || "")}</textarea></label>`;
    if (["requests", "services", "checklist_templates"].includes(kind))
      fields += `<div class="form-grid">${selectField(
        "Responsável",
        "assigned",
        members.map((m) => [m.id, m.name]),
        r?.assigned || "",
        kind === "checklist_templates",
      )}${field("Prazo", "due", r?.due || "", "date")}</div>`;
    if (["requests", "services", "announcements"].includes(kind))
      fields += selectField(
        "Prioridade",
        "priority",
        ["low", "normal", "high", "urgent"].map((v) => [v, labels[v]]),
        d.priority || "normal",
      );
    if (kind === "services")
      fields += field(
        "Local",
        "location",
        d.location || "",
        "text",
        'maxlength="180"',
      );
    if (kind === "requests")
      fields += refField("Unidade (opcional)", "unit_id", "units", d.unit_id);
    if (["announcements", "documents", "requests"].includes(kind))
      fields += field(
        "Categoria",
        "category",
        d.category || "",
        "text",
        'maxlength="80"',
      );
    if (["announcements", "documents"].includes(kind))
      fields +=
        selectField(
          "Público-alvo",
          "audience",
          [
            ["all", "Todos os vínculos validados"],
            ["blocks", "Blocos selecionados"],
            ["units", "Unidades selecionadas"],
          ],
          d.audience || "all",
          true,
        ) +
        `<div id="audience-options">${audienceOptions(d.audience || "all", d.audience_ids || [])}</div>`;
    if (kind === "units")
      fields += refField("Bloco", "block_id", "blocks", d.block_id, true);
    if (kind === "people")
      fields += `<div class="form-grid">${field("E-mail", "email", d.email || "", "email")}${field("Telefone", "phone", d.phone === "Não informado" ? "" : d.phone || "", "tel", 'maxlength="30"')}</div>`;
    if (kind === "unit_memberships")
      fields +=
        refField("Pessoa", "person_id", "people", d.person_id, true) +
        refField("Unidade", "unit_id", "units", d.unit_id, true) +
        selectField(
          "Tipo de vínculo",
          "relationship",
          [
            ["owner", "Proprietário"],
            ["resident", "Morador"],
            ["authorized", "Contato autorizado"],
          ],
          d.relationship || "resident",
          true,
        ) +
        `<label class="checkbox-label"><input type="checkbox" name="validated" ${d.validated ? "checked" : ""}>Vínculo conferido e validado</label>`;
    if (kind === "checklist_templates")
      fields += `<label>Itens (um por linha)<textarea name="items" rows="6" required>${esc((d.items || []).join("\n"))}</textarea></label>`;
    modal(
      `${r ? "Editar" : "Criar"} ${meta.singular}`,
      `<form id="record-form" class="form-body">${notice}<div class="alert error" id="form-error" role="alert" hidden></div>${r && ["announcements", "documents"].includes(kind) ? '<p class="demo-note">Salvar cria um novo rascunho. A versão anterior e seus arquivos serão preservados.</p>' : ""}${fields}<div class="form-actions"><button type="button" class="button secondary" data-close>Cancelar</button><button type="submit" class="button">${icon("check", 16)}Salvar registro</button></div></form>`,
      { type: "editor", kind, id },
    );
  }
  function saveForm(form) {
    const f = new FormData(form),
      { kind, id } = modalContext;
    let r = state.records.find((r) => r.id === id),
      d = r ? clone(r.data) : {};
    for (const key of [
      "description",
      "body",
      "priority",
      "location",
      "category",
      "unit_id",
      "block_id",
      "person_id",
      "relationship",
      "email",
      "phone",
    ])
      if (f.has(key)) d[key] = String(f.get(key));
    if (kind === "unit_memberships") d.validated = f.get("validated") === "on";
    if (["announcements", "documents"].includes(kind)) {
      d.audience = f.get("audience");
      d.audience_ids = f.getAll("audience_ids");
      if (d.audience !== "all" && !d.audience_ids.length)
        throw new Error("Selecione ao menos um destinatário.");
      delete d.recipients;
      delete d.publishedRevision;
    }
    if (kind === "checklist_templates") {
      d.items = String(f.get("items"))
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!d.items.length) throw new Error("Informe ao menos um item.");
    }
    const title = String(f.get("title") || "").trim();
    if (title.length < 2)
      throw new Error("Informe um título de ao menos dois caracteres.");
    if (r) {
      state.approvals
        .filter((a) => a.record === r.id && a.status === "pending")
        .forEach((a) => (a.status = "superseded"));
      if (["announcements", "documents"].includes(kind)) {
        r.status = "draft";
        r.files = [];
      }
      r.title = title;
      r.data = d;
      r.assigned = String(f.get("assigned") || r.assigned || "");
      r.due = f.has("due") ? String(f.get("due")) : r.due;
      changed(r, "Registro editado", "Nova versão salva na demonstração.");
    } else {
      r = {
        id: kind.slice(0, 2) + "-" + ++serial,
        kind,
        title,
        status:
          kind === "requests"
            ? "open"
            : kind === "services"
              ? "todo"
              : ["announcements", "documents"].includes(kind)
                ? "draft"
                : "active",
        data: d,
        assigned: String(f.get("assigned") || ""),
        due: String(f.get("due") || ""),
        created: now(),
        updated: now(),
        revision: 1,
        files: [],
        history: [],
        versions: [],
        messages: [],
      };
      state.records.unshift(r);
      snapshot(r);
      audit(r, "Registro criado na demonstração");
    }
    closeModal();
    render();
    openRecord(r.id);
    toast("Registro salvo apenas nesta aba.");
  }
  function audience(r) {
    const rows = [];
    const seen = new Set();
    for (const link of state.records.filter(
      (l) => l.kind === "unit_memberships" && l.data.validated,
    )) {
      const unit = state.records.find((u) => u.id === link.data.unit_id),
        person = state.records.find((p) => p.id === link.data.person_id);
      if (!unit || !person) continue;
      const type = r.data.audience || "all",
        ids = r.data.audience_ids || [];
      if (
        (type === "units" && !ids.includes(unit.id)) ||
        (type === "blocks" && !ids.includes(unit.data.block_id))
      )
        continue;
      const key = person.id + "/" + unit.id;
      if (!seen.has(key)) {
        seen.add(key);
        rows.push({ person: person.id, unit: unit.id });
      }
    }
    return rows;
  }
  function historyList(events) {
    return (
      events
        .map(
          (ev) =>
            `<div class="timeline"><span class="timeline-dot"></span><div><strong>${esc(ev.action)}</strong><p>${esc(memberName(ev.by))} · ${displayDate(ev.at, true)}</p>${ev.detail ? `<p>${esc(ev.detail)}</p>` : ""}</div></div>`,
        )
        .join("") || '<p class="demo-note">Nenhum evento nesta aba.</p>'
    );
  }
  function statuses(r) {
    if (r.kind === "requests")
      return (
        {
          open: ["in_progress", "cancelled"],
          in_progress: ["waiting", "resolved", "cancelled"],
          waiting: ["in_progress", "resolved", "cancelled"],
          resolved: ["in_progress"],
        }[r.status] || []
      );
    if (r.kind === "services")
      return (
        {
          todo: ["in_progress", "cancelled"],
          in_progress: ["done", "cancelled"],
          done: ["in_progress"],
        }[r.status] || []
      );
    return [];
  }
  function fileRows(files) {
    return (
      files
        .map(
          (f) =>
            `<div class="file-row">${icon("file", 16)}<span>${esc(f.name)}<small>${esc({ attachment: "Anexo", before: "Antes", after: "Depois", evidence: "Evidência" }[f.category] || f.category)} · ${f.demo ? "Nome ilustrativo, sem arquivo real" : Math.round(f.size / 1024) + " KB · somente nesta aba"}</small></span>${f.demo ? "" : btn(icon("download", 16), `data-file="${esc(f.id)}" aria-label="Abrir ${esc(f.name)}"`, true)}</div>`,
        )
        .join("") ||
      '<p class="demo-note">Nenhum arquivo anexado nesta versão.</p>'
    );
  }
  function openRecord(id) {
    const r = state.records.find((r) => r.id === id);
    if (!r) return;
    const publication = ["announcements", "documents"].includes(r.kind);
    const approval = state.approvals.find(
      (a) => a.record === id && a.status === "pending",
    );
    let tools = "";
    if (canEdit()) {
      if (
        r.kind !== "checklist_runs" &&
        !["done", "cancelled", "pending"].includes(r.status)
      )
        tools += btn("Editar registro", `data-edit="${r.id}"`, true);
      for (const s of statuses(r))
        tools += btn(
          labels[s],
          `data-status="${s}" data-record="${r.id}"`,
          true,
        );
      if (r.kind === "requests")
        tools += btn("Criar serviço vinculado", `data-service-from="${r.id}"`);
      if (r.kind === "checklist_templates")
        tools += btn("Gerar checklist de hoje", `data-generate="${r.id}"`);
      if (publication && r.status === "draft")
        tools += btn("Conferir e publicar", `data-publish="${r.id}"`);
    }
    if (approval)
      tools += btn("Revisar aprovação", `data-approval="${r.id}"`, true);
    let details = `<div class="detail-content"><div class="detail-meta">${badge(r.status)}${r.data.priority ? badge(r.data.priority) : ""}<span>Versão ${r.revision}</span><span>Protocolo ${esc(r.id.toUpperCase())}</span></div><p class="detail-body">${esc(r.data.body || r.data.description || "Consulte os dados e o histórico deste registro abaixo.")}</p><dl class="detail-grid"><div><dt>Responsável</dt><dd>${esc(memberName(r.assigned))}</dd></div><div><dt>Prazo</dt><dd>${displayDate(r.due)}</dd></div><div><dt>Criação</dt><dd>${displayDate(r.created, true)}</dd></div><div><dt>Última atualização</dt><dd>${displayDate(r.updated, true)}</dd></div>${[
      "email",
      "phone",
      "block_id",
      "unit_id",
      "person_id",
      "relationship",
      "validated",
      "category",
      "location",
      "day",
    ]
      .filter((k) => r.data[k] !== undefined)
      .map(
        (k) =>
          `<div><dt>${esc({ email: "E-mail", phone: "Telefone", block_id: "Bloco", unit_id: "Unidade", person_id: "Pessoa", relationship: "Vínculo", validated: "Vínculo validado", category: "Categoria", location: "Local", day: "Dia da execução" }[k])}</dt><dd>${esc(typeof r.data[k] === "boolean" ? (r.data[k] ? "Sim" : "Não") : k.endsWith("_id") ? recordName(r.data[k]) : labels[r.data[k]] || r.data[k])}</dd></div>`,
      )
      .join("")}</dl><div class="detail-tools">${tools}</div>`;
    if (r.data.source_request_id)
      details += `<div class="callout">Solicitação de origem: <button class="plain-button" data-open="${esc(r.data.source_request_id)}">${esc(recordName(r.data.source_request_id))}</button></div>`;
    if (r.kind === "units" || r.kind === "people")
      details += `<section class="detail-section"><h3>Vínculos relacionados</h3>${
        state.records
          .filter(
            (l) =>
              l.kind === "unit_memberships" &&
              (l.data.unit_id === r.id || l.data.person_id === r.id),
          )
          .map(
            (l) =>
              `<div class="approval-row"><span>${esc(recordName(l.data.person_id))} · ${esc(recordName(l.data.unit_id))}<small>${labels[l.data.relationship]} · ${l.data.validated ? "Validado" : "Aguardando validação"}</small></span><button class="text-button" data-open="${l.id}">Ver vínculo</button></div>`,
          )
          .join("") || '<p class="demo-note">Nenhum vínculo associado.</p>'
      }</section>`;
    if (r.kind === "checklist_templates")
      details += `<section class="detail-section"><h3>Itens do modelo</h3>${r.data.items.map((i, n) => `<div class="checklist-item"><span class="check-indicator">${n + 1}</span><strong>${esc(i)}</strong></div>`).join("")}<p class="demo-note">Alterar este modelo não modifica as execuções já geradas.</p></section>`;
    if (r.kind === "checklist_runs")
      details += `<section class="detail-section"><h3>Execução do dia</h3>${r.data.items.map((i, n) => `<div class="checklist-item"><span class="check-indicator ${i.done ? "checked" : ""}">${i.done ? icon("check", 14) : n + 1}</span><div><strong>${esc(i.label)}</strong>${i.done ? `<small>${esc(memberName(i.by))} · ${displayDate(i.at, true)}${i.note ? " · " + esc(i.note) : ""}</small>` : ""}</div>${!i.done && canEdit() ? btn("Concluir", `data-check="${n}" data-record="${r.id}"`, true) : ""}</div>`).join("")}</section>`;
    if (publication) {
      const recipients = r.data.recipients || audience(r);
      details += `<section class="detail-section"><h3>Público e alcance</h3><p class="demo-note">${r.status === "published" ? "Público preservado na versão publicada" : "Prévia atual de vínculos validados"}. Uma pessoa pode ter mais de uma unidade.</p><div class="audience-table">${recipients.map((l) => `<div><span>${esc(recordName(l.person))}</span><span>${esc(recordName(l.unit))}</span></div>`).join("") || "<div>Nenhum vínculo validado para este público.</div>"}</div><p class="demo-note">${new Set(recipients.map((l) => l.person)).size} pessoas · ${new Set(recipients.map((l) => l.unit)).size} unidades · ${recipients.length} vínculos</p><div class="alert info">${icon("info", 18)}<span>${r.status === "published" ? "Publicado na demonstração." : "Registro ainda não publicado."} Aviso externo não configurado. Nenhum envio, abertura ou ciência é simulado.</span></div>${r.data.priority === "urgent" ? '<div class="urgent-note">Aviso urgente: nenhum destinatário foi alcançado por um canal externo nesta demonstração.</div>' : ""}</section>`;
    }
    details += `<section class="detail-section"><h3>${icon("file", 17)}Arquivos — prévia local</h3><p class="demo-note">Os arquivos selecionados só podem ser abertos nesta aba. Não são enviados ao servidor nem protegidos por autenticação nesta versão HTML.</p>${fileRows(r.files)}${canEdit() && !["published", "pending", "done", "cancelled"].includes(r.status) ? `<form id="file-form" class="file-form" data-record="${r.id}"><label>Arquivo de demonstração (PDF, JPEG, PNG ou WebP, até 10 MB)<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required></label><div class="form-actions"><select name="category" aria-label="Categoria do arquivo"><option value="attachment">Anexo</option><option value="before">Antes do serviço</option><option value="after">Depois do serviço</option><option value="evidence">Evidência</option></select><button type="submit" class="button">Adicionar nesta aba</button></div><p class="field-error" role="alert" id="file-error"></p></form>` : ""}</section>`;
    if (["requests", "services"].includes(r.kind))
      details += `<section class="detail-section"><h3>Mensagens e observações</h3>${r.messages.map((m) => `<div class="message"><small>${esc(memberName(m.by))} · ${displayDate(m.at, true)} · ${m.visibility === "internal" ? "Interna" : "Externa (sem envio)"}</small><p>${esc(m.body)}</p></div>`).join("") || '<p class="demo-note">Nenhuma mensagem registrada.</p>'}${canEdit() ? `<form id="message-form" data-record="${r.id}"><label>Nova mensagem<textarea name="body" required maxlength="5000"></textarea></label><div class="form-actions"><select name="visibility" aria-label="Visibilidade da mensagem"><option value="internal">Interna</option><option value="external">Externa (sem envio)</option></select><button type="submit" class="button">Registrar na demonstração</button></div></form>` : ""}</section>`;
    details += `<section class="detail-section"><h3>Histórico e autoria</h3>${historyList(r.history)}</section><section class="detail-section"><h3>Versões preservadas</h3>${[
      ...r.versions,
    ]
      .reverse()
      .map(
        (v) =>
          `<details class="version"><summary>Versão ${v.revision} · ${displayDate(v.at, true)} · ${labels[v.status]}</summary><h4>${esc(v.title)}</h4><p class="detail-body">${esc(v.data.body || v.data.description || "Sem texto adicional.")}</p>${v.data.items ? `<p class="demo-note">${v.data.items.length} itens preservados nesta versão.</p>` : ""}${fileRows(v.files || [])}</details>`,
      )
      .join("")}</section></div>`;
    modal(r.title, details, { type: "detail", id: r.id });
  }
  function statusModal(id, target) {
    const r = state.records.find((r) => r.id === id);
    if (!canEdit() || !statuses(r).includes(target)) return;
    const required =
      target === "cancelled" ||
      ["done", "resolved"].includes(r.status) ||
      (target === "done" &&
        state.rules.require_evidence &&
        !r.files.some(
          (f) =>
            !f.demo &&
            f.mime?.startsWith("image/") &&
            ["after", "evidence"].includes(f.category),
        ));
    modal(
      labels[target],
      `<form id="status-form" class="form-body">${notice}<p class="demo-note">${esc(r.title)} · ${labels[r.status]} → ${labels[target]}</p><label>${target === "done" ? "Evidência / justificativa da conclusão" : "Observação / motivo"}<textarea name="reason" rows="4" ${required ? 'required minlength="5"' : ""} maxlength="2000"></textarea></label><div id="form-error" class="alert error" role="alert" hidden></div><div class="form-actions"><button type="button" class="button secondary" data-back="${r.id}">Voltar</button><button type="submit" class="button">Confirmar na demonstração</button></div></form>`,
      { type: "status", id, target },
    );
  }
  function changeStatus(form) {
    const { id, target } = modalContext,
      r = state.records.find((r) => r.id === id),
      reason = String(new FormData(form).get("reason") || "").trim();
    if (
      r.kind === "services" &&
      ["in_progress", "done"].includes(target) &&
      !r.assigned
    )
      throw new Error(
        "Edite o serviço e defina um responsável antes de iniciar ou concluir.",
      );
    if (
      target === "done" &&
      state.rules.require_evidence &&
      reason.length < 5 &&
      !r.files.some(
        (f) =>
          !f.demo &&
          f.mime?.startsWith("image/") &&
          ["after", "evidence"].includes(f.category),
      )
    )
      throw new Error(
        "Adicione uma foto de evidência ou informe uma justificativa.",
      );
    const previous = r.status;
    r.status =
      target === "done" && state.rules.service_approval ? "pending" : target;
    changed(
      r,
      `Estado alterado: ${labels[previous]} → ${labels[r.status]}`,
      reason,
    );
    if (r.status === "pending")
      state.approvals.unshift({
        id: "ap-" + ++serial,
        record: r.id,
        revision: r.revision,
        status: "pending",
        by: actor(),
        at: now(),
      });
    render();
    openRecord(id);
    toast("Estado atualizado na demonstração.");
  }
  function publishModal(id) {
    const r = state.records.find((r) => r.id === id),
      rows = audience(r);
    modal(
      "Conferir publicação",
      `<form id="publish-form" class="form-body">${notice}<h3>${esc(r.title)}</h3><p class="detail-body">${esc(r.data.body || r.data.description || "Sem texto adicional.")}</p><p class="demo-note">${new Set(rows.map((l) => l.person)).size} pessoas em ${new Set(rows.map((l) => l.unit)).size} unidades com vínculos validados.</p><div class="audience-table">${rows.map((l) => `<div><span>${esc(recordName(l.person))}</span><span>${esc(recordName(l.unit))}</span></div>`).join("") || "<div>Sem destinatários validados.</div>"}</div><div class="alert info">Publicação demonstrativa. Nenhuma mensagem será enviada.</div><div id="form-error" class="alert error" role="alert" hidden></div><div class="form-actions"><button type="button" class="button secondary" data-back="${id}">Voltar</button><button type="submit" class="button">${state.rules[r.kind === "announcements" ? "announcement_approval" : "document_approval"] ? "Enviar para aprovação" : "Publicar na demonstração"}</button></div></form>`,
      { type: "publish", id },
    );
  }
  function publish() {
    const r = state.records.find((r) => r.id === modalContext.id);
    if (!canEdit() || r.status !== "draft")
      throw new Error("A publicação exige um rascunho editável.");
    if (r.kind === "documents" && !r.files.some((f) => !f.demo))
      throw new Error(
        "Adicione um arquivo nesta aba antes de publicar o documento.",
      );
    const requires =
      state.rules[
        r.kind === "announcements"
          ? "announcement_approval"
          : "document_approval"
      ];
    r.status = requires ? "pending" : "published";
    r.data.recipients = audience(r);
    changed(
      r,
      requires
        ? "Aprovação solicitada"
        : "Publicação registrada na demonstração",
      "Aviso externo não configurado.",
    );
    if (requires)
      state.approvals.unshift({
        id: "ap-" + ++serial,
        record: r.id,
        revision: r.revision,
        status: "pending",
        by: actor(),
        at: now(),
      });
    else r.data.publishedRevision = r.revision;
    render();
    openRecord(r.id);
    toast(
      requires
        ? "Registro encaminhado à fila de aprovação demonstrativa."
        : "Publicado na demonstração, sem envio externo.",
    );
  }
  function approvalModal(id) {
    const r = state.records.find((r) => r.id === id),
      a = state.approvals.find(
        (a) => a.record === id && a.status === "pending",
      );
    if (!a) return;
    modal(
      "Decidir aprovação",
      `<form id="approval-form" class="form-body">${notice}<h3>${esc(r.title)}</h3><p class="demo-note">Versão ${a.revision} · solicitada por ${esc(memberName(a.by))}. Uma nova edição invalida esta solicitação.</p>${a.by === actor() ? '<div class="alert info">A mesma pessoa não pode decidir a própria solicitação. Feche esta janela e selecione a prévia de síndico no cabeçalho.</div>' : ""}<label>Decisão<select name="decision" aria-label="Decisão"><option value="approved">Aprovar</option><option value="rejected">Solicitar revisão</option></select></label><label>Justificativa<textarea name="reason" required minlength="3" rows="4" maxlength="2000"></textarea></label><div id="form-error" class="alert error" role="alert" hidden></div><div class="form-actions"><button type="button" class="button secondary" data-back="${id}">Voltar</button><button type="submit" class="button" ${a.by === actor() ? "disabled" : ""}>Registrar decisão demonstrativa</button></div></form>`,
      { type: "approval", id, approval: a.id },
    );
  }
  function decide(form) {
    const { id, approval } = modalContext,
      r = state.records.find((r) => r.id === id),
      a = state.approvals.find((a) => a.id === approval);
    if (!a || a.status !== "pending" || a.revision !== r.revision)
      throw new Error("Esta aprovação não corresponde à versão atual.");
    if (a.by === actor())
      throw new Error("Outra pessoa deve decidir esta solicitação.");
    const f = new FormData(form);
    a.status = f.get("decision");
    a.reason = String(f.get("reason")).trim();
    a.decidedBy = actor();
    a.decidedAt = now();
    r.status =
      a.status === "approved"
        ? r.kind === "services"
          ? "done"
          : "published"
        : r.kind === "services"
          ? "todo"
          : "draft";
    if (r.status === "published") r.data.recipients = audience(r);
    changed(
      r,
      a.status === "approved" ? "Aprovação registrada" : "Revisão solicitada",
      a.reason,
    );
    if (r.status === "published") r.data.publishedRevision = r.revision;
    render();
    openRecord(r.id);
    toast("Decisão registrada apenas na demonstração.");
  }
  function generate(id) {
    if (!canEdit()) return;
    const template = state.records.find((r) => r.id === id);
    if (!template.assigned) {
      toast("Defina um responsável no modelo antes de gerar a execução.");
      return;
    }
    const existing = state.records.find(
      (r) =>
        r.kind === "checklist_runs" &&
        r.data.template_id === id &&
        r.data.day === today(),
    );
    if (existing) {
      openRecord(existing.id);
      toast("A execução de hoje já existe. Nenhuma cópia foi criada.");
      return;
    }
    const r = {
      id: "ck-" + ++serial,
      kind: "checklist_runs",
      title: template.title,
      status: "todo",
      data: {
        template_id: id,
        template_revision: template.revision,
        day: today(),
        items: template.data.items.map((label) => ({ label, done: false })),
      },
      assigned: template.assigned,
      due: today(),
      created: now(),
      updated: now(),
      revision: 1,
      files: [],
      history: [],
      versions: [],
      messages: [],
    };
    state.records.unshift(r);
    snapshot(r);
    audit(
      r,
      "Execução diária gerada",
      "Itens copiados da versão " + template.revision + " do modelo.",
    );
    go("checklist_runs");
    openRecord(r.id);
    toast("Checklist demonstrativo gerado para hoje.");
  }
  function linkedService(id) {
    if (!canEdit()) return;
    const req = state.records.find((r) => r.id === id),
      existing = state.records.find(
        (r) => r.kind === "services" && r.data.source_request_id === id,
      );
    if (existing) {
      openRecord(existing.id);
      toast("Esta solicitação já tem um serviço vinculado.");
      return;
    }
    const r = {
      id: "sv-" + ++serial,
      kind: "services",
      title: req.title,
      status: "todo",
      data: {
        description: req.data.description,
        priority: req.data.priority || "normal",
        source_request_id: id,
        location: "",
      },
      assigned: req.assigned,
      due: req.due,
      created: now(),
      updated: now(),
      revision: 1,
      files: [],
      history: [],
      versions: [],
      messages: [],
    };
    state.records.unshift(r);
    snapshot(r);
    audit(r, "Serviço criado a partir de solicitação", req.id);
    audit(req, "Serviço vinculado", r.id);
    go("services");
    openRecord(r.id);
    toast("Serviço vinculado na demonstração, com ID próprio.");
  }
  function checkModal(id, index) {
    const r = state.records.find((r) => r.id === id),
      item = r.data.items[index];
    if (!canEdit() || item.done) return;
    modal(
      "Concluir item da rotina",
      `<form class="form-body" id="check-form">${notice}<h3>${esc(item.label)}</h3><label>Observação (opcional)<textarea name="note" rows="3" maxlength="2000"></textarea></label><p class="demo-note">Será registrado o autor da demonstração e o horário desta ação. Fotos opcionais podem ser anexadas à execução.</p><div class="form-actions"><button type="button" class="button secondary" data-back="${id}">Voltar</button><button type="submit" class="button">Concluir na demonstração</button></div></form>`,
      { type: "check", id, index },
    );
  }
  async function attach(form) {
    const r = state.records.find((r) => r.id === form.dataset.record),
      f = new FormData(form),
      file = f.get("file");
    if (!file || !file.size || file.size > 10485760)
      throw new Error("Use um arquivo de até 10 MB.");
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const dec = new TextDecoder();
    const valid =
      (file.type === "application/pdf" &&
        dec.decode(bytes.slice(0, 5)) === "%PDF-") ||
      (file.type === "image/png" &&
        [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)) ||
      (file.type === "image/jpeg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255) ||
      (file.type === "image/webp" &&
        dec.decode(bytes.slice(0, 4)) === "RIFF" &&
        dec.decode(bytes.slice(8, 12)) === "WEBP");
    if (!valid)
      throw new Error("Use PDF, PNG, JPEG ou WebP com conteúdo válido.");
    const url = URL.createObjectURL(file);
    objectUrls.add(url);
    r.files.push({
      id: "file-" + ++serial,
      name: file.name.slice(0, 180),
      url,
      mime: file.type,
      size: file.size,
      category: String(f.get("category")),
      demo: false,
    });
    changed(r, "Arquivo adicionado nesta aba", "Não enviado ao servidor.");
    render();
    openRecord(r.id);
    toast("Arquivo disponível somente nesta aba.");
  }
  function downloadCsv() {
    if (!state.permissions.export) {
      toast("A exportação está desativada na prévia de permissões.");
      return;
    }
    const cell = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    const rows = [
      ["DEMONSTRAÇÃO — dados fictícios, sem conexão ao Supabase"],
      ["ID", "Módulo", "Título", "Status", "Responsável", "Prazo"],
      ...filtered().map((r) => [
        r.id,
        modules.find((m) => m.key === r.kind).label,
        r.title,
        labels[r.status],
        memberName(r.assigned),
        r.due,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((r) => r.map(cell).join(";")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "condominio-DEMONSTRACAO.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    audit(null, "Relatório demonstrativo exportado");
    toast("CSV exportado com identificação de demonstração.");
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button,[data-view]");
    if (!el) return;
    const d = el.dataset;
    if (el.id === "menu") {
      setMenu(!$("#sidebar").classList.contains("is-open"));
      return;
    }
    if (el.id === "overlay") {
      setMenu(false);
      return;
    }
    if (el.id === "reset-demo") {
      if (
        !confirm(
          "Reiniciar os exemplos? As alterações e os arquivos desta aba serão descartados.",
        )
      )
        return;
      for (const url of objectUrls) URL.revokeObjectURL(url);
      objectUrls.clear();
      closeModal();
      seed();
      go("dashboard");
      toast("Exemplos reiniciados.");
      return;
    }
    if ("view" in d) {
      go(d.view, d.filter || "");
      return;
    }
    if ("close" in d) {
      closeModal();
      return;
    }
    if ("refresh" in d) {
      render();
      toast("Tela atualizada com os registros desta aba.");
      return;
    }
    if ("clear" in d) {
      search = "";
      filter = "";
      assigned = "";
      blockFilter = "";
      from = "";
      to = "";
      render();
      return;
    }
    if (d.new) {
      editor(d.new);
      return;
    }
    if (d.open || d.back) {
      openRecord(d.open || d.back);
      return;
    }
    if (d.edit) {
      const r = state.records.find((r) => r.id === d.edit);
      editor(r.kind, r.id);
      return;
    }
    if (d.status) {
      statusModal(d.record, d.status);
      return;
    }
    if (d.publish) {
      publishModal(d.publish);
      return;
    }
    if (d.approval) {
      approvalModal(d.approval);
      return;
    }
    if (d.generate) {
      generate(d.generate);
      return;
    }
    if (d.serviceFrom) {
      linkedService(d.serviceFrom);
      return;
    }
    if ("check" in d) {
      checkModal(d.record, Number(d.check));
      return;
    }
    if ("export" in d) {
      downloadCsv();
      return;
    }
    if (d.file) {
      const file = state.records
        .flatMap((r) => [
          ...r.files,
          ...r.versions.flatMap((v) => v.files || []),
        ])
        .find((f) => f.id === d.file);
      if (file?.url && objectUrls.has(file.url))
        window.open(file.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (d.member) {
      const m = members.find((m) => m.id === d.member);
      modal(
        "Permissões — " + m.name,
        `<div class="form-body">${notice}<p class="demo-note">Papel ilustrativo: ${labels[m.role]}. A autorização de produção é feita no backend.</p><ul class="setup-steps">${(m.role === "admin" ? ["Gerenciar unidades, pessoas e vínculos", "Criar comunicados, documentos e serviços", "Configurar regras e delegar ações", "Consultar histórico e relatórios"] : m.role === "manager" ? ["Acompanhar indicadores e registros", "Decidir aprovações de outros solicitantes", "Consultar versões e evidências", "Editar somente quando houver concessão explícita"] : ["Executar tarefas atribuídas", "Registrar evidências e observações", "Consultar somente o escopo delegado", "Sem acesso administrativo amplo"]).map((p) => `<li>${p}</li>`).join("")}</ul></div>`,
      );
    }
  });
  document.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      if (form.id === "record-form") {
        if (!canEdit()) throw new Error("Edição não concedida nesta prévia.");
        saveForm(form);
      } else if (form.id === "status-form") {
        changeStatus(form);
      } else if (form.id === "publish-form") {
        publish();
      } else if (form.id === "approval-form") {
        decide(form);
      } else if (form.id === "check-form") {
        const { id, index } = modalContext,
          r = state.records.find((r) => r.id === id),
          item = r.data.items[index];
        if (item.done || !canEdit())
          throw new Error("Item já concluído ou sem edição nesta prévia.");
        Object.assign(item, {
          done: true,
          by: actor(),
          at: now(),
          note: String(new FormData(form).get("note") || ""),
        });
        r.status = r.data.items.every((i) => i.done) ? "done" : "in_progress";
        changed(r, "Item de checklist concluído", item.label);
        render();
        openRecord(id);
        toast("Item concluído na demonstração.");
      } else if (form.id === "message-form") {
        if (!canEdit()) return;
        const r = state.records.find((r) => r.id === form.dataset.record),
          f = new FormData(form);
        r.messages.push({
          body: String(f.get("body")).trim(),
          visibility: String(f.get("visibility")),
          by: actor(),
          at: now(),
        });
        audit(
          r,
          "Mensagem registrada",
          f.get("visibility") === "external"
            ? "Externa, sem envio."
            : "Interna.",
        );
        render();
        openRecord(r.id);
        toast("Mensagem registrada apenas nesta aba.");
      } else if (form.id === "file-form") {
        const button = $("button[type=submit]", form);
        button.disabled = true;
        try {
          await attach(form);
        } finally {
          button.disabled = false;
        }
      } else if (form.id === "rules-form") {
        if (profile !== "admin")
          throw new Error("Use a prévia da administração para alterar regras.");
        const f = new FormData(form);
        for (const key of Object.keys(state.rules))
          state.rules[key] = f.get(key) === "on";
        audit(null, "Regras demonstrativas atualizadas");
        render();
        toast("Regras atualizadas somente nesta demonstração.");
      } else if (form.id === "permissions-form") {
        if (profile !== "admin")
          throw new Error(
            "Use a prévia da administração para alterar permissões.",
          );
        const f = new FormData(form);
        state.permissions.managerEdit = f.get("managerEdit") === "on";
        state.permissions.export = f.get("export") === "on";
        audit(null, "Prévia de permissões alterada");
        render();
        toast("Permissões de demonstração atualizadas.");
      }
    } catch (error) {
      const target = $("#form-error", form) || $("#file-error", form);
      if (target) {
        target.hidden = false;
        target.textContent = error.message;
      } else toast(error.message || "Não foi possível concluir.");
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "search") {
      const pos = e.target.selectionStart;
      search = e.target.value;
      render();
      const input = $("#search");
      input.focus();
      input.setSelectionRange(pos, pos);
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.id === "profile") {
      profile = el.value;
      closeModal();
      render();
      return;
    }
    const filters = {
      "status-filter": "status",
      "assigned-filter": "assigned",
      "block-filter": "block",
      "from-filter": "from",
      "to-filter": "to",
    };
    if (filters[el.id]) {
      if (el.id === "status-filter") filter = el.value;
      if (el.id === "assigned-filter") assigned = el.value;
      if (el.id === "block-filter") blockFilter = el.value;
      if (el.id === "from-filter") from = el.value;
      if (el.id === "to-filter") to = el.value;
      render();
      return;
    }
    if (el.name === "audience")
      $("#audience-options").innerHTML = audienceOptions(el.value);
  });
  $("#dialog").addEventListener("close", () => (modalContext = null));
  window.addEventListener("hashchange", () => {
    const [view, qs] = location.hash.slice(1).split("?");
    go(view || "dashboard", new URLSearchParams(qs || "").get("status") || "");
  });
  window.addEventListener("pagehide", () => {
    for (const url of objectUrls) URL.revokeObjectURL(url);
  });
  seed();
  const [initial, qs] = location.hash.slice(1).split("?");
  go(initial || "dashboard", new URLSearchParams(qs || "").get("status") || "");
})();
