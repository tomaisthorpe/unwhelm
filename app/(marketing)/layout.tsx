import { ReactNode } from "react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { Footer } from "@/components/footer";
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

      <Footer className="mt-24" />

      <div className="fixed bottom-4 right-4 z-50">
        <DarkModeToggle />
      </div>
    </div>
  );
}
