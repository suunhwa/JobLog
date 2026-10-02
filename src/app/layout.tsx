import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, Jua } from "next/font/google";
import "./globals.css";

const body = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
  preload: false,
});

const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
  preload: false,
});

export const metadata: Metadata = {
  title: "잡로그",
  description: "햄스터랑 같이 모으는 나의 취업 기록",
  icons: { apple: "/icons/icon-180.png" },
  appleWebApp: { capable: true, title: "잡로그", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fffcf7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // 지금은 햄스터 고정. 테마 선택 기능을 넣으면 사용자 설정값으로 바꾸면 됨.
  return (
    <html lang="ko" data-theme="hamster" className={`${body.variable} ${jua.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
