import { Sidebar, BottomNav } from "@/components/layout/sidebar";
import { ProtectedRoute } from "@/components/protected-route";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
