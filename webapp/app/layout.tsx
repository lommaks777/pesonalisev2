import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Persona Course Platform",
  description: "Персонализированные уроки массажа",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen flex flex-col">
            <header className="border-b bg-card">
              <div className="container flex h-14 items-center justify-between">
                <span className="font-semibold">Persona</span>
                <nav className="text-sm text-muted-foreground">
                  Персональные уроки
                </nav>
              </div>
            </header>
            <main className="flex-1 container py-8">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
