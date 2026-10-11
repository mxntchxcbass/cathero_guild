import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "캣히어로 길드 창고 분배",
  description: "길드원, 지급 기록, 시세 DB",
  other: {
    "codex-preview": process.env.NODE_ENV === "development" ? "development" : "production",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
