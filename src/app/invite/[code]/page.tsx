import Link from "next/link";
import { redirect } from "next/navigation";
import { Hamster } from "@/components/mascot/Hamster";
import { getUser } from "@/lib/supabase/server";

/** 초대 링크: /invite/HAM-XXXXX → 로그인 후 바로 이웃 추가 */
export default async function InvitePage({ params }: PageProps<"/invite/[code]">) {
  const { code } = await params;
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("add_friend", { code: decodeURIComponent(code) });
  if (!error) redirect(`/friends?added=${encodeURIComponent(String(data))}`);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <Hamster cheek={1} size={100} />
      <p className="font-display text-xl">이웃 추가를 못 했어요</p>
      <p className="text-sm text-muted">{error.message.replace(/^.*?: /, "")}</p>
      <Link href="/friends" className="h-12 rounded-2xl bg-primary px-6 font-display leading-[3rem] text-on-primary">
        이웃 화면으로
      </Link>
    </main>
  );
}
