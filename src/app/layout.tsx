import type { Metadata } from "next";
import "./globals.css";
import "../../assets/aquaville.css";
export const metadata: Metadata = {
  title: "AQUAVILLE | Portal de gestão",
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
