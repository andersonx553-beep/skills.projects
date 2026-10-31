import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Central Condomínio | Gestão com clareza",
  description: "Central de operação para administração e síndico.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
