import { CheckCircle2, Clock } from "lucide-react";
import { TaskCard } from "@/components/task-card";
import { getCompletedTasks, getContexts, getArchivedContexts, getBurndownData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { BurndownChart } from "@/components/burndown-chart";
import { startOfDay } from "@/lib/date-utils";
import Link from "next/link";
import { Metadata } from "next";

interface CompletedPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "unwhelm / Completed Tasks",
};

// Component to render a group of tasks
function TaskGroup({
  title,
  tasks,
  emptyMessage,
  contexts
}: {
  title: string;
  tasks: Awaited<ReturnType<typeof getCompletedTasks>>["data"];
  emptyMessage: string;
  contexts: Awaited<ReturnType<typeof getContexts>>;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm mb-6">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{tasks.length} tasks</p>
      </div>
      {tasks.length > 0 ? (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => {
            const completedDate = task.completedAt
              ? new Date(task.completedAt)
              : null;
            return (
              <div key={task.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <TaskCard
                      task={task}
                      contexts={contexts}
                      showContext={true}
                      showUrgency={false}
                    />
                  </div>
                  {completedDate && (
                    <div className="ml-4 text-right flex-shrink-0">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {completedDate.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {completedDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

export default async function CompletedPage({
  searchParams,
}: CompletedPageProps) {
  // Parse page parameter
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams.page
    ? parseInt(resolvedSearchParams.page, 10)
    : 1;
  const pageSize = 20;

  // Server-side data fetching
  const [completedResult, activeContexts, archivedContexts, burndownData] = await Promise.all([
    getCompletedTasks(page, pageSize),
    getContexts(),
    getArchivedContexts(),
    getBurndownData(),
  ]);

  // Combine active and archived contexts so tasks with archived contexts still show badges
  const contexts = [...activeContexts, ...archivedContexts];

  // Group tasks by today vs older
  const today = startOfDay(new Date());
  const todayTasks = completedResult.data.filter((task) => {
    if (!task.completedAt) return false;
    const completedDate = startOfDay(new Date(task.completedAt));
    return completedDate.getTime() === today.getTime();
  });
  
  const olderTasks = completedResult.data.filter((task) => {
    if (!task.completedAt) return false;
    const completedDate = startOfDay(new Date(task.completedAt));
    return completedDate.getTime() < today.getTime();
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Completed Tasks
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {completedResult.totalCount} tasks completed, ordered by
                  completion date
                </p>
              </div>
            </div>
            <Link href="/tasks">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Burndown Chart */}
        <div className="mb-6">
          <BurndownChart data={burndownData} />
        </div>

        {/* Completed Tasks List */}
        {completedResult.data.length > 0 ? (
          <>
            {/* Today's Completed Tasks */}
            <TaskGroup
              title="Today"
              tasks={todayTasks}
              emptyMessage="No tasks completed today yet."
              contexts={contexts}
            />

            {/* Older Completed Tasks */}
            <TaskGroup
              title="Older"
              tasks={olderTasks}
              emptyMessage="No older completed tasks."
              contexts={contexts}
            />

            {/* Pagination */}
            <Pagination
              currentPage={completedResult.currentPage}
              totalPages={completedResult.totalPages}
              hasNextPage={completedResult.hasNextPage}
              hasPreviousPage={completedResult.hasPreviousPage}
              totalCount={completedResult.totalCount}
              pageSize={pageSize}
            />
          </>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No completed tasks yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tasks you complete will appear here, ordered by when you
                finished them.
              </p>
              <Link href="/tasks">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        )}
    </div>
  );
}
