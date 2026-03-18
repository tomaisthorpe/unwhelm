import { CheckCircle2, LogOut, Settings, ShieldCheck } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signOutAction } from "@/lib/server-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";
import { isAdmin } from "@/lib/data";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Check authentication
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  const adminStatus = await isAdmin();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/tasks"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/unwhelm.svg"
                  alt="unwhelm logo"
                  width="32"
                  height="32"
                />
              </div>
              <h1 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-gray-100 font-brand">
                unwhelm
              </h1>
            </Link>
            <div className="flex items-center space-x-1 md:space-x-3">
              <Link href="/tasks/completed">
                <Button variant="ghost" size="sm">
                  <CheckCircle2 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Completed</span>
                </Button>
              </Link>
              {adminStatus && (
                <Link href="/settings/admin">
                  <Button variant="ghost" size="sm">
                    <ShieldCheck className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <DarkModeToggle />
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Sign out</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
