import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity w-fit"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Image
                src="/unwhelm.svg"
                alt="unwhelm logo"
                width={32}
                height={32}
              />
            </div>
            <h1 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-gray-100 font-brand">
              unwhelm
            </h1>
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}
