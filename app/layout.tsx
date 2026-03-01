import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub 热门解读 — AI 驱动的开源项目速览",
  description: "每日自动抓取 GitHub 热门项目，AI 生成中文解读，一目了然。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
