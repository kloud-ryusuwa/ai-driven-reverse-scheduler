import type { Metadata } from "next";
import "./globals.css";
import AppThemeProvider from "@/components/AppThemeProvider";

export const metadata: Metadata = {
  title: "AI-Driven Reverse Scheduler",
  description: "期日を守る。間に合わないなら、削ろう。AI 駆動型逆算スケジューラー",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body><AppThemeProvider>{children}</AppThemeProvider></body>
    </html>
  );
}
