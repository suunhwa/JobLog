import { Hamster } from "@/components/mascot/Hamster";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "로그인 · 잡로그" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-5">
      <Hamster cheek={1} size={140} />
      <div className="text-center">
        <h1 className="font-display text-3xl">잡로그</h1>
        <p className="mt-1 text-sm text-muted">햄스터랑 같이 모으는 나의 취업 기록</p>
      </div>
      <LoginForm />
    </main>
  );
}
