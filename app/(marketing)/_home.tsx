"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  TrendingUp,
  RefreshCw,
  Smartphone,
  Languages,
  BarChart2,
  CheckCircle,
  LogOut,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { ContextGroup } from "@/components/context-group";
import { calculateUrgency, evaluateUrgency } from "@/lib/utils";
import type { Task, Context, Tag } from "@/lib/data";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

const CONTEXTS: Context[] = [
  {
    id: "ctx-coding", name: "Coding", description: null,
    icon: "code-2", color: "bg-blue-600", coefficient: 0,
    shared: false, archived: false, isInbox: false,
    userId: "demo", createdAt: daysAgo(30), updatedAt: daysAgo(30),
  },
  {
    id: "ctx-kitchen", name: "Kitchen", description: null,
    icon: "utensils", color: "bg-green-600", coefficient: 0,
    shared: false, archived: false, isInbox: false,
    userId: "demo", createdAt: daysAgo(30), updatedAt: daysAgo(30),
  },
  {
    id: "ctx-admin", name: "Admin", description: null,
    icon: "briefcase", color: "bg-indigo-600", coefficient: 0,
    shared: false, archived: false, isInbox: false,
    userId: "demo", createdAt: daysAgo(30), updatedAt: daysAgo(30),
  },
  {
    id: "ctx-wellness", name: "Wellness", description: null,
    icon: "dumbbell", color: "bg-emerald-600", coefficient: 0,
    shared: false, archived: false, isInbox: false,
    userId: "demo", createdAt: daysAgo(30), updatedAt: daysAgo(30),
  },
];

const TAGS: Tag[] = [
  {
    id: "tag-client", name: "client", coefficient: 1.5, color: "bg-purple-500",
    userId: "demo", createdAt: daysAgo(30), updatedAt: daysAgo(30),
  },
];

const TAG_COEFFICIENTS = Object.fromEntries(TAGS.map((t) => [t.name, t.coefficient]));

function makeTask(overrides: Partial<Task> & { title: string; contextId: string }): Task {
  const base: Task = {
    id: Math.random().toString(36).slice(2),
    priority: "MEDIUM",
    tags: [],
    dueDate: null,
    waitDays: null,
    urgency: 0,
    completed: false,
    completedAt: null,
    type: "TASK",
    notes: null,
    subtasks: [],
    userId: "demo",
    createdAt: daysAgo(3),
    updatedAt: now,
    habitType: null,
    streak: null,
    longestStreak: null,
    frequency: null,
    nextDue: null,
    ...overrides,
  };
  base.urgency = calculateUrgency({
    priority: base.priority,
    dueDate: base.dueDate,
    createdAt: base.createdAt,
    tags: base.tags,
    contextCoefficient: 0,
    tagCoefficients: TAG_COEFFICIENTS,
  });
  return base;
}

const ALL_TASKS: Task[] = [
  // Coding
  makeTask({
    title: "Set up auth middleware for API v2",
    priority: "HIGH", tags: ["backend"],
    dueDate: daysFromNow(0), createdAt: daysAgo(12),
    contextId: "ctx-coding",
  }),
  makeTask({
    title: "Write tests for invoice parser",
    tags: ["client"],
    dueDate: daysFromNow(2), createdAt: daysAgo(5),
    contextId: "ctx-coding",
  }),
  makeTask({
    title: "Update README with new env vars",
    priority: "LOW", createdAt: daysAgo(1),
    contextId: "ctx-coding",
  }),
  makeTask({
    title: "Refactor database connection pooling",
    completed: true, completedAt: daysAgo(0), createdAt: daysAgo(8),
    contextId: "ctx-coding",
  }),
  // Kitchen
  makeTask({
    title: "Meal prep for the week",
    dueDate: daysFromNow(0), createdAt: daysAgo(2),
    contextId: "ctx-kitchen",
  }),
  makeTask({
    title: "Morning run",
    type: "HABIT", habitType: "STREAK", frequency: 1,
    completedAt: daysAgo(0), completed: true, streak: 4,
    createdAt: daysAgo(30), contextId: "ctx-kitchen",
  }),
  makeTask({
    title: "Vitamins",
    type: "HABIT", habitType: "WELLNESS", frequency: 1,
    completedAt: daysAgo(1), completed: true, streak: 2,
    createdAt: daysAgo(14), contextId: "ctx-kitchen",
  }),
  // Admin
  makeTask({
    title: "Send invoice to client",
    priority: "HIGH", tags: ["client"],
    dueDate: daysFromNow(2), createdAt: daysAgo(12),
    contextId: "ctx-admin",
  }),
  // Wellness
  makeTask({
    title: "Morning run",
    type: "HABIT", habitType: "STREAK", frequency: 1,
    completedAt: daysAgo(0), completed: true, streak: 4,
    createdAt: daysAgo(30), contextId: "ctx-wellness",
  }),
  makeTask({
    title: "Skincare routine",
    type: "HABIT", habitType: "WELLNESS", frequency: 1,
    completedAt: daysAgo(2), completed: true, streak: 0,
    createdAt: daysAgo(20), contextId: "ctx-wellness",
  }),
  makeTask({
    title: "10 min stretch",
    type: "HABIT", habitType: "WELLNESS", frequency: 1,
    completedAt: null, completed: false, streak: 0,
    createdAt: daysAgo(10), contextId: "ctx-wellness",
  }),
  makeTask({
    title: "Vitamins",
    type: "HABIT", habitType: "WELLNESS", frequency: 1,
    completedAt: daysAgo(0), completed: true, streak: 7,
    createdAt: daysAgo(14), contextId: "ctx-wellness",
  }),
];

const ctxCoding = CONTEXTS[0];
const ctxKitchen = CONTEXTS[1];
const ctxAdmin = CONTEXTS[2];
const ctxWellness = CONTEXTS[3];

const adminTask = ALL_TASKS.find((t) => t.contextId === "ctx-admin")!;
const adminBreakdown = evaluateUrgency({
  priority: adminTask.priority,
  dueDate: adminTask.dueDate,
  createdAt: adminTask.createdAt,
  tags: adminTask.tags,
  contextCoefficient: 0,
  tagCoefficients: TAG_COEFFICIENTS,
});
// Parse "Label: +X.XX" lines into { label, value } pairs, dropping zero contributions
const breakdownRows = adminBreakdown.explanation
  .map((line) => {
    const match = line.match(/^(.+):\s*([+-]?\d+\.?\d*)$/);
    if (!match) return null;
    return { label: match[1], value: parseFloat(match[2]) };
  })
  .filter((r): r is { label: string; value: number } => r !== null && r.value !== 0);
const breakdownMax = Math.max(...breakdownRows.map((r) => Math.abs(r.value)));

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketingHome() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Nav */}
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/unwhelm.svg" alt="unwhelm" width={32} height={32} />
            <span className="text-2xl font-bold font-brand text-gray-900 dark:text-gray-100">
              unwhelm
            </span>
          </div>
          <nav className="flex items-center gap-3">
            {isSignedIn ? (
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
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold font-brand text-gray-900 dark:text-gray-100 leading-tight">
            A task app that doesn&apos;t
            <br />
            <span className="text-blue-500">turn into a guilt machine.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Task lists are overwhelming. unwhelm scores every task by urgency so
            you always know what to work on next, and organises by context so
            you only see what&apos;s relevant right now.
          </p>
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
            <span className="font-medium text-gray-600 dark:text-gray-400">Free to use.</span> If paid plans are ever introduced, existing users will be grandfathered in.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-base"
            >
              Get started free
            </Link>
            <Link
              href="/auth/signin"
              className="w-full sm:w-auto px-8 py-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-base"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Main app screenshot */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {/* App header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center space-x-3">
                  <Image src="/unwhelm.svg" alt="unwhelm" width={32} height={32} />
                  <span className="text-2xl font-bold font-brand text-gray-900 dark:text-gray-100">
                    unwhelm
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4" /> Completed
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Settings className="w-4 h-4" /> Settings
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 p-4 space-y-4">
              <ContextGroup
                context={ctxCoding}
                tasks={ALL_TASKS}
                allContexts={CONTEXTS}
                tags={TAGS}
                readOnly
              />
              <ContextGroup
                context={ctxKitchen}
                tasks={ALL_TASKS}
                allContexts={CONTEXTS}
                tags={TAGS}
                readOnly
              />
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="bg-gray-50 dark:bg-gray-950 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold font-brand text-gray-900 dark:text-gray-100 text-center mb-3">
              Built for personal life, not project management
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
              No AI summaries, no gamification, no shame language.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: TrendingUp,
                  title: "Urgency scoring that explains itself",
                  description:
                    "No more doom-scrolling through 40 overdue items wondering where to start. Each task gets a score and you can see exactly what's driving it.",
                },
                {
                  icon: MapPin,
                  title: "Organised by context",
                  description:
                    "Kitchen, coding, errands, phone calls. Personal life doesn't run on projects and deadlines. When you're in the kitchen, you see kitchen tasks.",
                },
                {
                  icon: RefreshCw,
                  title: "Habits without broken streaks",
                  description:
                    "A habit you haven't done in a while is \"getting due\", not overdue. No streak to protect, no shame when life gets in the way.",
                },
                {
                  icon: Languages,
                  title: "Natural language input",
                  description:
                    "Type \"call dentist !phone p1 next friday\" and it parses the context, priority, and date. Quick capture, no form.",
                },
                {
                  icon: BarChart2,
                  title: "Context health at a glance",
                  description:
                    "Each context shows how well-maintained that area of your life is, based on habit completion. Not a productivity score. Just useful signal.",
                },
                {
                  icon: Smartphone,
                  title: "PWA",
                  description:
                    "Installs to your home screen on iOS, Android, and desktop. Badge count on the icon shows how many tasks are due today.",
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Urgency detail */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold font-brand text-gray-900 dark:text-gray-100 mb-4">
                No more staring at a list wondering where to start
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Inspired by TaskWarrior&apos;s urgency model, scores are
                calculated from priority, age, due date, and tags. Each factor
                is visible, not hidden behind an algorithm. If the score
                doesn&apos;t match your gut, you can tune the coefficients.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Tasks sort by urgency. Completed items drop to the bottom.
                That&apos;s it.
              </p>
            </div>
            <div className="space-y-4">
              <ContextGroup
                context={ctxAdmin}
                tasks={ALL_TASKS}
                allContexts={CONTEXTS}
                tags={TAGS}
                readOnly
              />
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Urgency breakdown
                </div>
                {breakdownRows.map(({ label, value }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
                        {value >= 0 ? "+" : ""}{value.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(Math.abs(value) / breakdownMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-sm font-semibold">
                  <span className="text-gray-900 dark:text-gray-100">Total</span>
                  <span className="px-1.5 py-0.5 rounded tabular-nums text-red-600 bg-red-100 dark:bg-red-950/50 dark:text-red-400">
                    {adminBreakdown.score.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Habits detail */}
        <section className="bg-gray-50 dark:bg-gray-950 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <ContextGroup
                context={ctxWellness}
                tasks={ALL_TASKS}
                allContexts={CONTEXTS}
                tags={TAGS}
                readOnly
              />
              <div>
                <h2 className="text-3xl font-bold font-brand text-gray-900 dark:text-gray-100 mb-4">
                  Habits without the shame cycle
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Most habit apps live or die by the streak. Miss one day and
                  the guilt kicks in. unwhelm doesn&apos;t work like that. A
                  habit you haven&apos;t done in a while is just &ldquo;getting
                  due&rdquo;. No broken streak, no lecture.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Four types (streak, learning, wellness, maintenance) each
                  treated differently. A cleaning habit doesn&apos;t need the
                  same energy as a daily run.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stability promise */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-8 py-12 text-center">
            <h2 className="text-3xl font-bold font-brand text-gray-900 dark:text-gray-100 mb-4">
              Your workflows won&apos;t break overnight
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6">
              Most productivity apps redesign themselves every 18 months. Layouts
              change, features move, things you relied on quietly disappear. The
              mental overhead of keeping up with the tool defeats the point of
              having one.
            </p>
            <p className="text-gray-700 dark:text-gray-300 font-medium max-w-xl mx-auto">
              unwhelm is a small, focused app. The UI stays stable. The
              core concepts don&apos;t shift. What works today will still work
              next year.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-bold font-brand text-gray-900 dark:text-gray-100 mb-4">
            Give it a go
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto">
            No onboarding wizard. Sign up and start adding tasks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-base"
            >
              Create an account
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-base"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/unwhelm.svg" alt="unwhelm" width={20} height={20} />
            <span>unwhelm</span>
          </div>
          <div className="flex gap-6">
            <Link
              href="/auth/signin"
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
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
