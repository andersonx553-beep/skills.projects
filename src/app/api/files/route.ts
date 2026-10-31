import { authenticated, safeOrigin, failure } from "@/lib/supabase";
export async function GET(req: Request) {
  try {
    const { db } = await authenticated();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return failure("Arquivo não informado");
    const { data, error } = await db
      .from("attachments")
      .select("path")
      .eq("id", id)
      .eq("ready", true)
      .single();
    if (error || !data) return failure("Arquivo indisponível", 404);
    const signed = await db.storage
      .from("condominium-private")
      .createSignedUrl(data.path, 60);
    if (signed.error) throw signed.error;
    return Response.json(
      { url: signed.data.signedUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return failure("Não foi possível abrir o arquivo", 403);
  }
}
export async function POST(req: Request) {
  if (!safeOrigin(req)) return failure("Origem não autorizada", 403);
  try {
    if (Number(req.headers.get("content-length") || 0) > 11000000)
      return failure("Arquivo acima de 10 MB", 413);
    const { db } = await authenticated(),
      form = await req.formData(),
      file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > 10485760)
      return failure("Selecione PDF ou imagem de até 10 MB");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid =
      (file.type === "application/pdf" &&
        new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") ||
      (file.type === "image/png" &&
        [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) ||
      (file.type === "image/jpeg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255) ||
      (file.type === "image/webp" &&
        new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
        new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP");
    if (!valid)
      return failure(
        "Tipo de arquivo não corresponde ao conteúdo. Use PDF, PNG, JPEG ou WebP.",
      );
    const prepared = await db.rpc("prepare_attachment", {
      p_record: form.get("record"),
      p_revision: Number(form.get("revision")),
      p_name: file.name.replaceAll(/[\\/\x00-\x1f]/g, "").slice(0, 180),
      p_mime: file.type,
      p_size: file.size,
      p_category: form.get("category") || "attachment",
    });
    if (prepared.error) return failure(prepared.error.message, 403);
    const upload = await db.storage
      .from("condominium-private")
      .upload(prepared.data, bytes, { contentType: file.type, upsert: false });
    if (upload.error)
      return failure(
        "Falha no armazenamento. O arquivo não foi confirmado; tente novamente.",
      );
    const complete = await db.rpc("finish_attachment", {
      p_path: prepared.data,
    });
    if (complete.error) return failure(complete.error.message);
    return Response.json({ ok: true });
  } catch {
    return failure("Não foi possível anexar o arquivo");
  }
}
