import { authenticated, safeOrigin, failure } from "@/lib/supabase";
import { z } from "zod";
const uuid = z.string().uuid();
const command = z.discriminatedUnion("command", [
  z.object({ command: z.literal("revoke"), condominium: uuid, user: uuid }),
  z.object({
    command: z.literal("bootstrap"),
    name: z.string().trim().min(2).max(120),
    displayName: z.string().trim().min(2).max(120),
  }),
  z.object({
    command: z.literal("save"),
    condominium: uuid,
    kind: z.string(),
    id: uuid.nullable(),
    revision: z.number().int().nonnegative(),
    title: z.string().trim().min(2).max(180),
    data: z.record(z.string(), z.unknown()),
    assigned: uuid.nullable(),
    due: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
  }),
  z.object({
    command: z.literal("action"),
    id: uuid,
    revision: z.number().int().positive(),
    action: z.enum([
      "publish",
      "approve",
      "reject",
      "message",
      "create_service",
      "generate",
      "check_item",
      "status",
    ]),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
  z.object({ command: z.literal("audience"), id: uuid }),
  z.object({
    command: z.literal("settings"),
    condominium: uuid,
    settings: z.record(z.string(), z.boolean()),
  }),
  z.object({
    command: z.literal("member"),
    condominium: uuid,
    user: uuid,
    name: z.string().trim().min(2).max(120),
    role: z.enum(["admin", "manager", "operator"]),
    permissions: z.array(z.string()).max(100),
  }),
]);
export async function POST(req: Request) {
  if (!safeOrigin(req)) return failure("Origem não autorizada", 403);
  try {
    if (Number(req.headers.get("content-length") || 0) > 100000)
      return failure("Requisição muito grande", 413);
    const body = command.parse(await req.json());
    const { db } = await authenticated();
    let result;
    switch (body.command) {
      case "revoke":
        result = await db.rpc("deactivate_member", {
          p_condominium: body.condominium,
          p_user: body.user,
        });
        break;
      case "bootstrap":
        result = await db.rpc("bootstrap_condominium", {
          p_name: body.name,
          p_display_name: body.displayName,
        });
        break;
      case "save":
        result = await db.rpc("save_record", {
          p_condominium: body.condominium,
          p_kind: body.kind,
          p_id: body.id,
          p_revision: body.revision,
          p_title: body.title,
          p_data: body.data,
          p_assigned: body.assigned,
          p_due: body.due,
        });
        break;
      case "action":
        result = await db.rpc("record_action", {
          p_id: body.id,
          p_revision: body.revision,
          p_action: body.action,
          p_payload: body.payload,
        });
        break;
      case "audience":
        result = await db.rpc("audience_preview", { p_record: body.id });
        break;
      case "settings":
        result = await db.rpc("configure_condominium", {
          p_condominium: body.condominium,
          p_settings: body.settings,
        });
        break;
      case "member":
        result = await db.rpc("manage_member", {
          p_condominium: body.condominium,
          p_user: body.user,
          p_name: body.name,
          p_role: body.role,
          p_permissions: body.permissions,
        });
        break;
    }
    if (result.error) return failure(result.error.message, 403);
    return Response.json({ ok: true, data: result.data });
  } catch (e) {
    return failure(
      e instanceof z.ZodError
        ? "Confira os campos obrigatórios."
        : e instanceof Error
          ? e.message
          : "Não foi possível salvar",
    );
  }
}
