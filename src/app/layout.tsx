import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import SidebarNavigation from "@/components/sidebar-navigation";
import { Toaster } from "sonner";
import "@/lib/console-filter"; // Filter development console warnings
import Link from "next/link";
import { Settings } from "lucide-react";
import { MockModeIndicator } from "@/components/mock-mode-indicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Builder MVP - Idea to Enterprise",
  description: "Transform your ideas into fully operational virtual enterprises",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="light" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Força tema claro sempre
              document.documentElement.classList.add('light');
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme', 'light');
              localStorage.setItem('theme', 'light');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white text-gray-900`} suppressHydrationWarning={true}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="border-b px-6 py-4 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80">Builder MVP</Link>
                <MockModeIndicator />
              </div>
              <Link href="/config" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
            </header>
            <main className="flex-1 overflow-auto bg-slate-50">
              {children}
            </main>
          </div>
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
