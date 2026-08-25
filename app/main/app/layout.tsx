import type { Metadata } from "next";
import "./globals.css";
import AppThemeProvider from "@/components/AppThemeProvider";
import AppShell from "@/components/AppShell";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

export const metadata: Metadata = {
  title: "AI-Driven Reverse Scheduler",
  description: "期日を守る。間に合わないなら、削ろう。AI 駆動型逆算スケジューラー",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body><AppRouterCacheProvider><AppThemeProvider><AppShell>{children}</AppShell></AppThemeProvider></AppRouterCacheProvider></body>
    </html>
  );
}
