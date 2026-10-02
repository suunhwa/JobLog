"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok?: boolean; error?: string } | null;

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "이메일을 입력해 주세요." };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { ok: true };
}

/** 구글 로그인: Supabase가 만들어준 구글 로그인 페이지로 보냄 */
export async function signInWithGoogle() {
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
