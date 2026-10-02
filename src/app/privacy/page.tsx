export const metadata = { title: "개인정보처리방침 · 잡로그" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-8 text-sm leading-relaxed">
      <h1 className="font-display text-2xl">개인정보처리방침</h1>
      <p className="text-muted">시행일: 2026년 10월 2일</p>

      <h2 className="font-display text-base">1. 수집하는 정보</h2>
      <p>
        로그인 시 이메일 주소, 이름, 프로필 사진(구글 로그인의 경우)을 받습니다. 사용자가 직접 입력한
        채용 공고 링크·내용, 전형 진행 상황, 메모를 저장합니다.
      </p>

      <h2 className="font-display text-base">2. 이용 목적</h2>
      <p>로그인, 지원 기록 저장 및 조회, 공고 내용 자동 정리 기능 제공에만 사용합니다.</p>

      <h2 className="font-display text-base">3. 외부 처리</h2>
      <p>
        데이터는 Supabase(데이터베이스·인증)에 저장되며, 공고 내용 정리를 위해 공고 텍스트가 AI
        서비스(Google Gemini 등)로 전송됩니다. 메모 등 개인 기록은 AI로 전송하지 않습니다.
      </p>

      <h2 className="font-display text-base">4. 보관 및 삭제</h2>
      <p>
        회원이 탈퇴하거나 삭제를 요청하면 지체 없이 삭제합니다. 각 공고는 앱 안에서 직접 삭제할 수
        있습니다.
      </p>

      <h2 className="font-display text-base">5. 문의</h2>
      <p>snna628@gmail.com</p>
    </main>
  );
}
