import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar, BottomNav } from "@/components/layout/sidebar";
import { ProtectedRoute } from "@/components/protected-route";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard Financiero",
  description: "Dashboard de finanzas personales",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="h-full bg-background text-foreground antialiased">
        <ProtectedRoute>
          <div className="flex h-full min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto pb-16 lg:pb-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {children}
              </div>
            </main>
          </div>
          <BottomNav />
        </ProtectedRoute>
      </body>
    </html>
  );
}
