import Image from "next/image";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-gray-100 dark:border-gray-800", className)}>
      <div className="max-w-5xl mx-auto px-6 py-6 pb-20 md:pb-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Image src="/unwhelm.svg" alt="unwhelm" width={20} height={20} />
          <span className="font-brand font-bold text-gray-900 dark:text-gray-100">
            unwhelm
          </span>
        </div>
        <p className="text-center">
          Questions or feedback?{" "}
          <a
            href="mailto:hello@unwhelm.app"
            className="underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            hello@unwhelm.app
          </a>
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/tomaisthorpe/unwhelm"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.597 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
