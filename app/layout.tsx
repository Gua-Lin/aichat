import type { Metadata } from "next";
import ThemeInit from "./components/theme/ThemeInit";
import "./globals.css";
import "./styles/theme.css";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "AI 聊天助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
