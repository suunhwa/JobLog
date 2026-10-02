export const metadata = { title: "이용약관 · 잡로그" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-8 text-sm leading-relaxed">
      <h1 className="font-display text-2xl">이용약관</h1>
      <p className="text-muted">시행일: 2026년 10월 2일</p>
      <p>
        잡로그는 개인의 취업 지원 기록을 돕는 무료 서비스입니다. AI가 정리한 공고 내용은 참고용이며,
        정확한 정보는 반드시 원문 공고에서 확인해 주세요.
      </p>
      <p>
        다른 사람의 권리를 침해하거나 서비스 운영을 방해하는 방식으로 이용할 수 없습니다. 서비스는
        사전 안내 후 변경되거나 중단될 수 있습니다.
      </p>
      <p>문의: snna628@gmail.com</p>
    </main>
  );
}
