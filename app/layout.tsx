import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAYA | Codex-built lives",
  description: "Describe a person. Codex builds their world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
