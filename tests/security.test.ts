import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  csvCell,
  filterItems,
  dailySeries,
  type Item,
} from "../src/lib/domain.ts";

test("Banco: isolamento, autorização e fluxos transacionais", async (t) => {
  const db = new PGlite();
  await db.exec(`create role authenticated;create role anon;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth,storage to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;grant select,insert on storage.objects to authenticated;`);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610310001_central.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const [admin, other, manager, operator, unverified] = Array.from(
    { length: 5 },
    () => randomUUID(),
  );
  for (const id of [admin, other, manager, operator, unverified])
    await db.query("insert into auth.users values($1,$2)", [
      id,
      id === unverified ? null : new Date().toISOString(),
    ]);
  const as = async (id: string, role = "authenticated") => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec(`set role ${role}`);
  };
  const scalar = async (sql: string, args: unknown[] = []) => {
    const r = await db.query<Record<string, unknown>>(sql, args);
    return Object.values(r.rows[0] || {})[0];
  };
  const save = async (
    c: string,
    k: string,
    title: string,
    data: Record<string, unknown> = {},
    assigned: string | null = null,
    id: string | null = null,
    revision = 0,
  ) =>
    String(
      await scalar(
        "select public.save_record($1,$2,$3,$4,$5,$6::jsonb,$7,null)",
        [c, k, id, revision, title, JSON.stringify(data), assigned],
      ),
    );
  const get = async (id: string) => {
    const r = await db.query<Item>("select * from public.records where id=$1", [
      id,
    ]);
    return r.rows[0];
  };
  const action = async (
    id: string,
    act: string,
    payload: Record<string, unknown> = {},
  ) => {
    const r = await get(id);
    return scalar("select public.record_action($1,$2,$3,$4::jsonb)", [
      id,
      r.revision,
      act,
      JSON.stringify(payload),
    ]);
  };
  let c1 = "",
    c2 = "",
    req = "",
    service = "",
    block = "",
    unit = "",
    person = "",
    link = "",
    announcement = "",
    template = "",
    run = "";
  await t.test("Conta não confirmada não cria condomínio", async () => {
    await as(unverified);
    await assert.rejects(
      () =>
        scalar(
          "select public.bootstrap_condominium('Sem confirmação','Pessoa')",
        ),
      /Confirme/,
    );
  });
  await t.test("Bootstrap autenticado cria condomínio isolado", async () => {
    await as(admin);
    c1 = String(
      await scalar(
        "select public.bootstrap_condominium('Condomínio A','Admin A')",
      ),
    );
    await assert.rejects(
      () =>
        scalar("select public.bootstrap_condominium('Duplicado','Admin A')"),
      /já vinculada/,
    );
    await as(other);
    c2 = String(
      await scalar(
        "select public.bootstrap_condominium('Condomínio B','Admin B')",
      ),
    );
    assert.notEqual(c1, c2);
  });
  await t.test("RLS esconde outros condomínios e vínculos", async () => {
    const result = await db.query<{ id: string }>(
      "select id from public.condominiums",
    );
    assert.deepEqual(
      result.rows.map((r) => r.id),
      [c2],
    );
    const m = await db.query("select * from public.memberships");
    assert.equal(m.rows.length, 1);
  });
  await t.test("Gravação direta e funções internas são negadas", async () => {
    await assert.rejects(
      () =>
        db.query("update public.condominiums set name=$1 where id=$2", [
          "Ataque",
          c2,
        ]),
      /permission denied/,
    );
    await assert.rejects(
      () => db.query("select public.log_event($1,null,$2)", [c1, "forjado"]),
      /permission denied/,
    );
  });
  await t.test(
    "Solicitação, unidade e pessoas persistem com versões",
    async () => {
      await as(admin);
      block = await save(c1, "blocks", "Bloco A");
      unit = await save(c1, "units", "Unidade 101", { block_id: block });
      person = await save(c1, "people", "Pessoa de teste");
      link = await save(c1, "unit_memberships", "Vínculo 101", {
        unit_id: unit,
        person_id: person,
        relationship: "owner",
        validated: true,
      });
      req = await save(
        c1,
        "requests",
        "Vazamento",
        { description: "Inspeção necessária", unit_id: unit, priority: "high" },
        admin,
      );
      assert.equal((await get(req)).status, "open");
      assert.equal(
        await scalar(
          "select count(*) from public.record_versions where record_id=$1",
          [req],
        ),
        1,
      );
    },
  );
  await t.test(
    "Referência a unidade de outro condomínio é rejeitada",
    async () => {
      await as(other);
      await assert.rejects(
        () => save(c2, "requests", "Tentativa", { unit_id: unit }),
        /fora do condomínio/,
      );
      await assert.rejects(
        () => save(c1, "requests", "Tentativa"),
        /Sem permissão/,
      );
      assert.equal(
        (await db.query("select * from public.records where id=$1", [req])).rows
          .length,
        0,
      );
    },
  );
  await t.test("Anônimo não tem leitura nem execução", async () => {
    await as("", "anon");
    await assert.rejects(
      () => db.query("select * from public.records"),
      /permission denied/,
    );
    await assert.rejects(
      () => db.query("select public.record_action($1,1,$2)", [req, "publish"]),
      /permission denied/,
    );
  });
  await t.test("Permissões por ação e prevenção de autoelevação", async () => {
    await as(admin);
    await db.query("select public.manage_member($1,$2,$3,$4,$5::text[])", [
      c1,
      manager,
      "Síndico",
      "manager",
      [
        "requests.read",
        "services.read",
        "announcements.read",
        "documents.read",
        "approvals.read",
        "approvals.decide",
      ],
    ]);
    await db.query("select public.manage_member($1,$2,$3,$4,$5::text[])", [
      c1,
      operator,
      "Operador",
      "operator",
      [
        "requests.read",
        "requests.write",
        "services.read",
        "services.write",
        "checklist_runs.read",
        "checklist_runs.write",
      ],
    ]);
    await assert.rejects(
      () =>
        db.query("select public.manage_member($1,$2,$3,$4,$5::text[])", [
          c1,
          admin,
          "Auto",
          "admin",
          ["*"],
        ]),
      /próprias/,
    );
    await as(manager);
    assert.ok(await get(req));
    await assert.rejects(
      () => save(c1, "requests", "Alterar", {}, null, req, 1),
      /Sem permissão/,
    );
  });
  await t.test(
    "Operador só consulta registros atribuídos e não os reatribui",
    async () => {
      await as(admin);
      const assigned = await save(
        c1,
        "requests",
        "Atribuída ao operador",
        {},
        operator,
      );
      await as(operator);
      assert.equal(
        (await db.query("select * from public.records where id=$1", [req])).rows
          .length,
        0,
      );
      assert.ok(await get(assigned));
      await assert.rejects(
        () => save(c1, "requests", "Reatribuição", {}, admin, assigned, 1),
        /reatribuir/,
      );
      await assert.rejects(
        () => save(c1, "requests", "Não delegado"),
        /Criação/,
      );
    },
  );
  await t.test(
    "Transições e serviço vinculado têm histórico e IDs próprios",
    async () => {
      await as(admin);
      await assert.rejects(
        () => action(req, "status", { status: "resolved" }),
        /Transição/,
      );
      await action(req, "status", { status: "in_progress" });
      service = String(await action(req, "create_service"));
      assert.notEqual(service, req);
      assert.equal((await get(service)).data.source_request_id, req);
      await assert.rejects(() => action(req, "create_service"), /já possui/);
      await action(service, "status", { status: "in_progress" });
      await assert.rejects(
        () => action(service, "status", { status: "done" }),
        /evidência/,
      );
      await action(service, "status", {
        status: "done",
        reason: "Inspeção e reparo conferidos no local",
      });
      assert.equal((await get(service)).status, "done");
      await assert.rejects(
        () => action(service, "status", { status: "in_progress" }),
        /motivo/,
      );
      await action(service, "status", {
        status: "in_progress",
        reason: "Nova ocorrência no mesmo ponto",
      });
      assert.equal((await get(service)).status, "in_progress");
    },
  );
  await t.test(
    "Escrita concorrente desatualizada não sobrescreve registro",
    async () => {
      await assert.rejects(
        () => save(c1, "requests", "Título stale", {}, admin, req, 1),
        /outra pessoa/,
      );
    },
  );
  await t.test(
    "Mensagens conservam autoria e classificação sem simular envio",
    async () => {
      await action(req, "message", {
        body: "Anotação interna",
        visibility: "internal",
      });
      await action(req, "message", {
        body: "Resposta registrada",
        visibility: "external",
      });
      const r = await db.query<{ created_by: string; visibility: string }>(
        "select created_by,visibility from public.messages where record_id=$1 order by created_at",
        [req],
      );
      assert.equal(r.rows.length, 2);
      assert.ok(r.rows.every((m) => m.created_by === admin));
      await assert.rejects(
        () => action(req, "message", { body: "Teste", visibility: "public" }),
        /check constraint/,
      );
    },
  );
  await t.test(
    "Destinatários deduplicam vínculos e aceitam pessoa com duas unidades",
    async () => {
      const unit2 = await save(c1, "units", "Unidade 102", { block_id: block });
      await save(c1, "unit_memberships", "Segundo vínculo", {
        unit_id: unit2,
        person_id: person,
        relationship: "resident",
        validated: true,
      });
      announcement = await save(c1, "announcements", "Aviso de inspeção", {
        body: "Texto original",
        audience: "all",
        audience_ids: [],
      });
      const a = await db.query<Record<string, unknown>>(
        "select * from public.audience_preview($1)",
        [announcement],
      );
      assert.equal(a.rows.length, 2);
      assert.equal(
        new Set(a.rows.map((r: Record<string, unknown>) => r.person_id)).size,
        1,
      );
    },
  );
  await t.test(
    "Aprovação opcional exige outro decisor e versão atual",
    async () => {
      await db.query("select public.configure_condominium($1,$2::jsonb)", [
        c1,
        JSON.stringify({ announcement_approval: true }),
      ]);
      await action(announcement, "publish");
      assert.equal((await get(announcement)).status, "pending");
      await assert.rejects(
        () => action(announcement, "approve", { reason: "Autoaprovação" }),
        /Outra pessoa/,
      );
      await as(manager);
      await action(announcement, "approve", {
        reason: "Texto e público conferidos",
      });
      assert.equal((await get(announcement)).status, "published");
      assert.equal(
        await scalar(
          "select count(*) from public.recipients where record_id=$1",
          [announcement],
        ),
        2,
      );
      assert.equal(
        await scalar(
          "select count(*) from public.announcement_events where record_id=$1",
          [announcement],
        ),
        0,
      );
    },
  );
  await t.test(
    "Edição de publicado preserva versão anterior e exige nova aprovação",
    async () => {
      await as(admin);
      const old = await get(announcement);
      await save(
        c1,
        "announcements",
        "Aviso revisado",
        { body: "Texto novo", audience: "all", audience_ids: [] },
        null,
        announcement,
        old.revision,
      );
      assert.equal((await get(announcement)).status, "draft");
      const v = await db.query<{ snapshot: Item }>(
        "select snapshot from public.record_versions where record_id=$1 and revision=$2",
        [announcement, old.revision],
      );
      assert.equal(v.rows[0].snapshot.data.body, "Texto original");
      await action(announcement, "publish");
      assert.equal((await get(announcement)).status, "pending");
    },
  );
  await t.test(
    "Checklist diário copia modelo e não duplica execução",
    async () => {
      template = await save(
        c1,
        "checklist_templates",
        "Rotina diária",
        { items: ["Portões", "Iluminação"] },
        admin,
      );
      run = String(await action(template, "generate"));
      await assert.rejects(() => action(template, "generate"), /já gerado/);
      const old = await get(template);
      await save(
        c1,
        "checklist_templates",
        "Rotina revisada",
        { items: ["Novo item"] },
        admin,
        template,
        old.revision,
      );
      assert.deepEqual((await get(run)).data.items, [
        { label: "Portões", done: false },
        { label: "Iluminação", done: false },
      ]);
      await action(run, "check_item", { index: 0, note: "Conferido" });
      assert.equal((await get(run)).status, "in_progress");
      await assert.rejects(
        () => action(run, "check_item", { index: 0 }),
        /já concluído/,
      );
      await action(run, "check_item", { index: 1 });
      assert.equal((await get(run)).status, "done");
    },
  );
  await t.test(
    "Arquivos privados exigem upload, identidade e estado; documento sem arquivo não publica",
    async () => {
      const doc = await save(c1, "documents", "Regimento", { audience: "all" });
      await assert.rejects(() => action(doc, "publish"), /Anexe/);
      const path = String(
        await scalar("select public.prepare_attachment($1,1,$2,$3,100,$4)", [
          doc,
          "regimento.pdf",
          "application/pdf",
          "attachment",
        ]),
      );
      await assert.rejects(
        () => db.query("select public.finish_attachment($1)", [path]),
        /não encontrado/,
      );
      await db.query(
        "insert into storage.objects(bucket_id,name) values($1,$2)",
        ["condominium-private", path],
      );
      await db.query("select public.finish_attachment($1)", [path]);
      assert.equal(
        (await db.query("select * from storage.objects where name=$1", [path]))
          .rows.length,
        1,
      );
      await action(doc, "publish");
      const v = await db.query<{ snapshot: { files: unknown[] } }>(
        "select snapshot from public.record_versions where record_id=$1 order by revision desc limit 1",
        [doc],
      );
      assert.equal(v.rows[0].snapshot.files.length, 1);
      await as(other);
      assert.equal(
        (await db.query("select * from storage.objects where name=$1", [path]))
          .rows.length,
        0,
      );
      await assert.rejects(
        () =>
          db.query(
            "insert into storage.objects(bucket_id,name) values($1,$2)",
            ["condominium-private", path + "x"],
          ),
        /row-level security/,
      );
    },
  );
  await t.test(
    "Exportação e configuração exigem concessão específica",
    async () => {
      await as(manager);
      await assert.rejects(
        () => db.query("select public.record_export($1)", [c1]),
        /não autorizada/,
      );
      await assert.rejects(
        () =>
          db.query("select public.configure_condominium($1,$2::jsonb)", [
            c1,
            '{"require_evidence":false}',
          ]),
        /Sem permissão/,
      );
      await as(admin);
      await db.query("select public.record_export($1)", [c1]);
      assert.equal(
        await scalar(
          "select count(*) from public.audit_events where action='report.exported'",
        ),
        1,
      );
    },
  );
  await t.test(
    "Auditoria e snapshots não podem ser reescritos pelo cliente",
    async () => {
      await assert.rejects(
        () => db.query("delete from public.audit_events"),
        /permission denied/,
      );
      await assert.rejects(
        () => db.query("update public.record_versions set snapshot=$1", ["{}"]),
        /permission denied/,
      );
    },
  );
  await t.test(
    "Revogar membro bloqueia imediatamente seu acesso pelo banco",
    async () => {
      await as(admin);
      await assert.rejects(
        () => db.query("select public.deactivate_member($1,$2)", [c1, admin]),
        /não autorizada/,
      );
      await db.query("select public.deactivate_member($1,$2)", [c1, operator]);
      await as(operator);
      assert.equal(
        (await db.query("select * from public.records")).rows.length,
        0,
      );
      await assert.rejects(
        () => save(c1, "requests", "Após revogação"),
        /Sem permissão/,
      );
    },
  );
  await db.close();
});

test("CSV neutraliza fórmulas e preserva aspas", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("Nome;com separador"), '"Nome;com separador"');
});
test("Filtros de relatório respeitam bloco da unidade, período e responsável", () => {
  const unit = {
    id: "u1",
    kind: "units",
    data: { block_id: "b1" },
    created_at: "2026-10-01",
    title: "101",
    status: "active",
  } as unknown as Item;
  const req = {
    id: "r1",
    kind: "requests",
    data: { unit_id: "u1" },
    created_at: "2026-10-25",
    title: "Vazamento",
    status: "open",
    assigned_to: "a1",
  } as unknown as Item;
  assert.deepEqual(
    filterItems(
      [unit, req],
      "requests",
      "vaza",
      "open",
      "a1",
      "2026-10-20",
      "2026-10-31",
      "b1",
    ).map((i) => i.id),
    ["r1"],
  );
  assert.equal(
    filterItems([unit, req], "requests", "", "", "a2", "", "", "").length,
    0,
  );
});

test("Série diária usa o fuso do condomínio na virada UTC", () => {
  const i = { kind: "requests", created_at: "2026-11-01T01:30:00Z" } as Item;
  const series = dailySeries([i], "2026-10-31", "America/Fortaleza");
  assert.equal(series.at(-1)?.count, 1);
  assert.equal(
    series.reduce((n, s) => n + s.count, 0),
    1,
  );
});
