import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "StudyVui Admin CMS",
  description: "Content management for StudyVui learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
