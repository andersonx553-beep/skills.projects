import { authenticated, failure, safeOrigin } from "@/lib/supabase";
import { csvCell, filterItems, type Item } from "@/lib/domain";
export async function POST(req: Request) {
  if (!safeOrigin(req)) return failure("Origem não autorizada", 403);
  try {
    const { db } = await authenticated(),
      body = await req.json();
    const allowed = await db.rpc("has_permission", {
      c: body.condominium,
      p: "reports.export",
    });
    if (allowed.error || !allowed.data)
      return failure("Exportação não autorizada", 403);
    const records: Item[] = [];
    for (let page = 0; page < 20; page++) {
      const r = await db
        .from("records")
        .select("*")
        .eq("condominium_id", body.condominium)
        .order("id")
        .range(page * 1000, page * 1000 + 999);
      if (r.error) throw r.error;
      records.push(...r.data);
      if (r.data.length < 1000) break;
      if (page === 19) return failure("Volume excede o limite de exportação");
    }
    const rows = filterItems(
      records,
      body.kind || "",
      body.query || "",
      body.status || "",
      body.assigned || "",
      body.from || "",
      body.to || "",
      body.block || "",
    );
    const audit = await db.rpc("record_export", {
      p_condominium: body.condominium,
    });
    if (audit.error) throw audit.error;
    const csv = [
      ["ID", "Módulo", "Título", "Status", "Responsável", "Prazo", "Criado em"],
      ...rows.map((r) => [
        r.id,
        r.kind,
        r.title,
        r.status,
        r.assigned_to,
        r.due_date,
        r.created_at,
      ]),
    ]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n");
    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="central-relatorio.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return failure("Falha ao exportar os registros");
  }
}
