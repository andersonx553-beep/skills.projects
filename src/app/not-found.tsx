import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-wrap">
      <h1>Página não encontrada</h1>
      <Link href="/">Voltar à Central</Link>
    </main>
  );
}
