export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-semibold">Persona</span>
          <nav className="text-sm text-muted-foreground flex items-center gap-4">
            <a href="/dashboard" className="hover:underline">Персональные уроки</a>
            <a href="/dashboard/templates" className="hover:underline">Шаблоны (рыбы)</a>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-8">{children}</main>
    </div>
  );
}


