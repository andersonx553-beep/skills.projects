"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-wrap">
      <h1>Não foi possível abrir a Central</h1>
      <p>Tente carregar novamente. Seus registros permanecem no banco.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
