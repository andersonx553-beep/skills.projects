import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
export async function GET(req: Request) {
  const url = new URL(req.url),
    hash = url.searchParams.get("token_hash"),
    type = url.searchParams.get("type"),
    code = url.searchParams.get("code");
  const redirect = new URL("/", process.env.APP_URL || url.origin);
  try {
    const db = await supabase();
    const result = code
      ? await db.auth.exchangeCodeForSession(code)
      : hash && ["recovery", "invite", "signup", "email"].includes(type || "")
        ? await db.auth.verifyOtp({
            token_hash: hash,
            type: type as EmailOtpType,
          })
        : { error: true };
    if (result.error) redirect.searchParams.set("auth_error", "1");
    else if (type === "recovery" || code)
      redirect.searchParams.set("password", "1");
  } catch {
    redirect.searchParams.set("auth_error", "1");
  }
  return NextResponse.redirect(redirect);
}
