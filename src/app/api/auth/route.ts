import { configured, supabase, safeOrigin, failure } from "@/lib/supabase";
import { z } from "zod";
export async function POST(req: Request) {
  if (!safeOrigin(req)) return failure("Origem não autorizada", 403);
  if (!configured()) return failure("Supabase ainda não configurado", 503);
  try {
    const body = z
      .object({
        action: z.enum(["login", "logout", "reset", "update_password"]),
        email: z.string().email().optional(),
        password: z.string().min(8).max(200).optional(),
      })
      .parse(await req.json());
    const db = await supabase();
    if (body.action === "logout") {
      const { error } = await db.auth.signOut();
      if (error) throw error;
    }
    if (body.action === "login") {
      if (!body.email || !body.password)
        return failure("Informe e-mail e senha");
      const { error } = await db.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error)
        return failure(
          "Não foi possível entrar. Confira os dados e a confirmação do e-mail.",
          401,
        );
    }
    if (body.action === "reset") {
      if (!body.email) return failure("Informe o e-mail");
      const { error } = await db.auth.resetPasswordForEmail(body.email, {
        redirectTo: `${process.env.APP_URL || new URL(req.url).origin}/auth/confirm`,
      });
      if (error)
        return failure(
          "Não foi possível solicitar a recuperação. Tente novamente.",
        );
    }
    if (body.action === "update_password") {
      if (!body.password) return failure("Informe a nova senha");
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) return failure("Link inválido ou expirado", 401);
      const { error } = await db.auth.updateUser({ password: body.password });
      if (error) return failure("Não foi possível alterar a senha");
    }
    return Response.json({ ok: true });
  } catch {
    return failure(
      "Não foi possível processar a autenticação. Confira os campos.",
    );
  }
}
