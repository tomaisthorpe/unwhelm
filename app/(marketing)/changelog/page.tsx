import type { Metadata } from "next";
import { changelog } from "@/content/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "The latest updates and improvements to unwhelm.",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 md:pt-20">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Changelog
        </h1>
      </header>

      <div className="space-y-10">
        {changelog.map((entry) => (
          <article
            key={entry.date}
            aria-labelledby={`update-${entry.date}`}
            className="border-t border-gray-100 dark:border-gray-800 pt-8"
          >
            <h2
              id={`update-${entry.date}`}
              className="text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              <time dateTime={entry.date}>
                {dateFormatter.format(new Date(`${entry.date}T00:00:00Z`))}
              </time>
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-400 leading-relaxed">
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
