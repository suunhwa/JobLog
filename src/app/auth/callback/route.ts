import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 초대 링크로 들어왔던 경우 그 페이지로 돌려보냄
      const cookieStore = await cookies();
      const next = cookieStore.get("jl_next")?.value;
      const target = next && next.startsWith("/invite/") ? next : "/";
      const res = NextResponse.redirect(`${origin}${target}`);
      if (next) res.cookies.delete("jl_next");
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
