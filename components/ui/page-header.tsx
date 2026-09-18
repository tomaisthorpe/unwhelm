import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  backHref,
  backLabel = "Back to Dashboard",
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl leading-tight font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {backHref && (
          <Link href={backHref} className="shrink-0" title={backLabel}>
            <Button variant="outline" aria-label={backLabel}>
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
