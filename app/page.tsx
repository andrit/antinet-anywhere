/**
 * App shell for antinet-pwa. Replace freely — nothing here is load-bearing.
 */
export default function Home() {
  return (
    <main className="shell">
      <h1>antinet-pwa</h1>
      <p className="sub">Full-stack web application — server-rendered or SPA frontend with a backend API, database, authentication, and deployment pipeline.</p>
      <p className="hint">
        Scaffolded by the AI Dev Workbench. Health check at <code>/api/health</code>. See{" "}
        <code>README-fullstack.md</code> for what is already wired up.
      </p>
    </main>
  );
}
