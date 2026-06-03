"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, getUser } from "@/lib/auth";
import { LogOut, User } from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) return null;

  if (!user) return null;

  return (
    <div className="border-t border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User className="w-4 h-4" />
        <div className="flex-1 truncate">
          <p className="font-medium text-gray-900 truncate">
            {user.user_metadata?.name || user.email}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </button>
    </div>
  );
}
