import Link from "next/link";
import { Hamster } from "@/components/mascot/Hamster";
import { signInWithGoogle } from "./actions";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "로그인 · 잡로그" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-5">
      <Hamster cheek={1} size={140} />
      <div className="text-center">
        <h1 className="font-display text-3xl">잡로그</h1>
        <p className="mt-1 text-sm text-muted">햄스터랑 같이 모으는 나의 취업 기록</p>
      </div>

      <form action={signInWithGoogle} className="w-full">
        <button className="h-12 w-full rounded-2xl border-2 border-line bg-surface font-display text-base">
          Google로 계속하기
        </button>
      </form>

      <div className="flex w-full items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        또는 이메일로
        <span className="h-px flex-1 bg-line" />
      </div>

      <LoginForm />

      {error && <p className="text-sm text-fail">로그인에 실패했어요. 다시 시도해 주세요.</p>}

      <p className="text-xs text-muted">
        <Link href="/terms" className="underline underline-offset-2">이용약관</Link>
        {" · "}
        <Link href="/privacy" className="underline underline-offset-2">개인정보처리방침</Link>
      </p>
    </main>
  );
}
