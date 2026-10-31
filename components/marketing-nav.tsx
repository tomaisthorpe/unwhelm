"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

export function MarketingNav() {
  const { status } = useSession();

  return (
    <nav className="flex items-center gap-3">
      {status === "authenticated" ? (
        <Link
          href="/tasks"
          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md transition-colors inline-flex items-center gap-1.5"
        >
          Go to tasks <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <>
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
        </>
      )}
    </nav>
  );
}
