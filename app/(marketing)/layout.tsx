import { ReactNode } from "react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import Link from "next/link";
import Image from "next/image";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <Image src="/unwhelm.svg" alt="unwhelm" width={32} height={32} />
            <span className="text-2xl font-bold font-brand text-gray-900 dark:text-gray-100">
              unwhelm
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-100 dark:border-gray-800 mt-24">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/unwhelm.svg" alt="unwhelm" width={20} height={20} />
            <span>unwhelm</span>
          </div>
          <div className="flex gap-6">
            <Link href="/auth/signin" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 z-50">
        <DarkModeToggle />
      </div>
    </div>
  );
}
