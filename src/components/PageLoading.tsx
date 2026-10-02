import { Hamster } from "@/components/mascot/Hamster";

export function PageLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-5">
      <Hamster cheek={2} size={96} className="animate-bounce" />
      <p className="text-sm text-muted">햄스터가 가져오는 중...</p>
    </main>
  );
}
