import { authenticated, configured, failure } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!configured())
    return Response.json(
      { configured: false, user: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  try {
    const { db, user } = await authenticated();
    const url = new URL(req.url);
    const cid = url.searchParams.get("condominium");
    const rid = url.searchParams.get("record");
    if (url.searchParams.has("audit")) {
      const r = await db
        .from("audit_events")
        .select("*")
        .eq("condominium_id", url.searchParams.get("audit"))
        .order("created_at", { ascending: false })
        .limit(200);
      if (r.error) throw r.error;
      return Response.json(
        { events: r.data },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (rid) {
      const queries = await Promise.all([
        db
          .from("record_versions")
          .select("*")
          .eq("record_id", rid)
          .order("revision", { ascending: false })
          .limit(100),
        db
          .from("messages")
          .select("*")
          .eq("record_id", rid)
          .order("created_at")
          .limit(500),
        db
          .from("attachments")
          .select("*")
          .eq("record_id", rid)
          .eq("ready", true)
          .order("created_at"),
        db
          .from("audit_events")
          .select("*")
          .eq("record_id", rid)
          .order("created_at", { ascending: false })
          .limit(100),
        db
          .from("recipients")
          .select("*", { count: "exact", head: true })
          .eq("record_id", rid)
          .eq("revision", Number(url.searchParams.get("revision") || 0)),
        db
          .from("announcement_events")
          .select("*")
          .eq("record_id", rid)
          .eq("revision", Number(url.searchParams.get("revision") || 0))
          .limit(1000),
      ]);
      for (const q of queries) if (q.error) throw q.error;
      return Response.json(
        {
          versions: queries[0].data,
          messages: queries[1].data,
          attachments: queries[2].data,
          events: queries[3].data,
          recipients: queries[4].count,
          delivery: queries[5].data,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const [membershipResult, condoResult] = await Promise.all([
      db
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true),
      db.from("condominiums").select("*"),
    ]);
    if (membershipResult.error || condoResult.error)
      throw membershipResult.error || condoResult.error;
    const condos = condoResult.data || [],
      selected = condos.find((c) => c.id === cid) || condos[0];
    if (!selected)
      return Response.json(
        {
          configured: true,
          user: { id: user.id, email: user.email },
          condos,
          records: [],
          members: [],
          memberships: membershipResult.data,
          approvals: [],
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    // Fetch every page. Refuse an incomplete dataset rather than misreport dashboard totals.
    const records = [];
    for (let page = 0; page < 20; page++) {
      const r = await db
        .from("records")
        .select("*")
        .eq("condominium_id", selected.id)
        .order("id")
        .range(page * 1000, page * 1000 + 999);
      if (r.error) throw r.error;
      records.push(...r.data);
      if (r.data.length < 1000) break;
      if (page === 19)
        throw new Error(
          "Volume acima do limite desta versão. Refine o carregamento antes de calcular indicadores.",
        );
    }
    const [members, approvals] = await Promise.all([
      db
        .from("memberships")
        .select("*")
        .eq("condominium_id", selected.id)
        .eq("active", true),
      db
        .from("approvals")
        .select("*")
        .eq("condominium_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    if (members.error || approvals.error)
      throw members.error || approvals.error;
    return Response.json(
      {
        configured: true,
        user: { id: user.id, email: user.email },
        condos,
        selected: selected.id,
        memberships: membershipResult.data,
        members: members.data,
        records,
        approvals: approvals.data,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Falha ao consultar os registros";
    return failure(msg, msg.startsWith("Sessão") ? 401 : 500);
  }
}
