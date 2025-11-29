# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

unwhelm is a context-based task management application built with Next.js 15 (App Router), React 19 Server Components, TypeScript, PostgreSQL/Prisma, and NextAuth.js. It features customizable urgency scoring (inspired by TaskWarrior), flexible habit tracking with 4 distinct types, and natural language task parsing.

**Core Philosophy:** Prioritize user psychology over rigid productivity systems. Habits should feel supportive, not demanding. Context health gives a sense of life balance.

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run lint             # Run ESLint

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Database
npm run db:push          # Push schema changes (development)
npm run db:migrate       # Run migrations (production)
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed with demo data
npm run db:studio        # Open Prisma Studio GUI
```

## Architecture

### Server-First Design

This codebase follows React/Next.js best practices with a server-first architecture:

- **Server Components by default** - Only use `"use client"` when absolutely necessary (interactive components, hooks, browser APIs)
- **Server Actions for mutations** - All data mutations go through Server Actions in `lib/server-actions.ts`
- **Server-side data fetching** - Data loading happens in `lib/data.ts` with `getServerSession`
- **Optimistic UI** - Interactive components use `useTransition` for immediate feedback while Server Actions execute

### Key Files

**Data Layer:**

- `lib/data.ts` - Server-side data fetching (getTasks, getContexts, getTags)
- `lib/server-actions.ts` - All mutations (create/update/delete tasks, contexts, tags)
- `lib/prisma.ts` - Singleton Prisma client
- `prisma/schema.prisma` - Database schema

**Business Logic:**

- `lib/utils.ts` - Urgency calculation (`evaluateUrgency`), utility functions
- `lib/urgency-config.ts` - Urgency scoring constants (priority, age, due date coefficients)
- `lib/habits.ts` - Habit-specific utilities (status calculation, streak tracking)
- `lib/habit-utils.ts` - Additional habit utilities (complementary to habits.ts)
- `lib/task-completion-utils.ts` - Task completion logic for all task types
- `lib/date-utils.ts` - Date calculations respecting local calendar days
- `lib/email.ts` - Email service supporting Resend API and SMTP for self-hosting
- `lib/badge-utils.ts` - PWA badge functionality (count tasks, update badge, permissions)
- `lib/context-icons.ts` - Context icon mapping to Lucide components
- `lib/feature-limits.ts` - Resource limit configuration (MAX_TASKS, MAX_CONTEXTS)
- `lib/validation.ts` - Centralized form validation utilities
- `lib/hooks/use-pwa-badge.ts` - React hook for PWA badge management

**Client Components:**

- `components/dashboard-client.tsx` - Main client wrapper with optimistic UI
- `components/task-toggle-button.tsx` - Interactive task completion button
- `components/task-card.tsx` - Task display with metadata, urgency, and status
- `components/task-form.tsx` - Reusable task form for modal and inline editing
- `components/add-item-modal.tsx` - Task/context creation modal with tabs
- `components/smart-task-input.tsx` - Natural language task input with parsing
- `components/contexts-section.tsx` - Context section wrapper with search
- `components/context-group.tsx` - Individual context display with health bar
- `components/context-collapsible.tsx` - Collapsible context component
- `components/today-section.tsx` - Today section wrapper
- `components/pagination.tsx` - Pagination for completed tasks page
- `components/burndown-chart.tsx` - Task completion visualization (Recharts)
- `components/badge-permission-banner.tsx` - PWA badge permission prompt
- `components/archived-contexts.tsx` - Archive management modal
- `components/account-settings-form.tsx` - Account settings UI
- `components/ui/subtasks-input.tsx` - Interactive subtasks with drag-and-drop
- `components/ui/tags-input.tsx` - Tag input with autocomplete
- `components/ui/markdown-text.tsx` - Markdown rendering component
- `app/page.tsx` - Main dashboard (Server Component that fetches data)

### Database Schema

**Core Models:**

- `Task` - All task types (regular, habit, recurring) with type discriminator
  - Includes `notes` (String), `subtasks` (JSON array), `completedAt` (DateTime), `waitDays` (Int)
  - Subtasks format: `[{id: string, text: string, completed: boolean}]`
- `Context` - Task organization by location/situation (kitchen, coding, bathroom)
  - Includes `archived` (Boolean), `isInbox` (Boolean), `icon`, `color`, `coefficient`
- `Tag` - Custom tags with urgency coefficients
- `TaskTag` - Junction table for many-to-many task-tag relationships
- `HabitCompletion` - Historical habit completion tracking
- `User` - NextAuth.js user with credentials auth
- `Account`, `Session`, `VerificationToken` - NextAuth.js authentication tables

**Task Types:**

1. `TASK` - Regular one-off tasks with due dates
2. `HABIT` - Recurring activities with flexible timing, streak tracking
3. `RECURRING` - Scheduled items with strict deadlines (meetings, bills)

**Habit Types:** `STREAK`, `LEARNING`, `WELLNESS`, `MAINTENANCE` (affects UI emphasis)

**Priority Levels:** `LOW`, `MEDIUM`, `HIGH`

## Urgency System

The urgency calculation is in `lib/utils.ts:evaluateUrgency()`. It combines:

1. **Priority** - LOW/MEDIUM/HIGH with configurable coefficients
2. **Age** - How long the task has existed (older = more urgent)
3. **Due date proximity** - Exponential scaling as due date approaches, saturating for overdue
4. **Wait days** - Optional delay before urgency calculation starts (new feature)
5. **Project** - Fixed coefficient if project exists
6. **Tags** - Custom per-tag coefficients
7. **Context** - Custom per-context coefficients

Configuration lives in `lib/urgency-config.ts`. The system is designed to be transparent and customizable.

## Habit System

Habits use relaxed, non-judgmental language and have flexible timing:

**Status Language:**

- "✓ Fresh" - Recently completed, no action needed
- "⏰ Getting due" - Approaching usual frequency
- "⚡ Ready" - Available to do when convenient
- "🔄 Time for another" - Past usual frequency but not stressed

**Completion Logic:**

- Habits don't have "deadlines" - they have target frequencies
- Streaks track consecutive completions within frequency window
- `frequency` field is in days (1=daily, 7=weekly)
- Completion history stored in `HabitCompletion` table
- Logic in `lib/task-completion-utils.ts:completeTask()`

**Habit Types affect UI emphasis:**

- `STREAK` - Exercise, meditation (prominent streak display)
- `LEARNING` - Coding practice, reading (moderate emphasis)
- `WELLNESS` - Skincare, make bed (balanced)
- `MAINTENANCE` - Cleaning (de-emphasized, focus on "last done")

## Context Health

Context health is calculated based ONLY on habit completion (not regular tasks). It represents how well-maintained that area of life is. Calculation respects each habit's frequency and shows a percentage for each context.

## Subtasks

Tasks can have subtasks stored as a JSON array in the database:

**Data Structure:**

- Stored in `Task.subtasks` field as JSON: `[{id: string, text: string, completed: boolean}]`
- Managed via `components/ui/subtasks-input.tsx`

**Features:**

- Drag-and-drop reordering using `@dnd-kit/sortable`
- Inline editing of subtask text
- Independent completion state (doesn't affect parent task)
- Progress summary display ("X of Y completed")
- Keyboard-accessible with grab handles

**Usage:**

- Available in task creation/editing modal
- Displayed in task cards with completion count
- Persisted with task updates via server actions

## Archived Contexts

Contexts can be archived to reduce clutter while preserving historical data:

**Features:**

- Archive/unarchive via context menu in UI
- Archived contexts don't appear in main dashboard
- Dedicated "Archived Contexts" modal to view and restore
- All tasks remain associated with archived contexts
- Database field: `Context.archived` (Boolean)

**Server Actions:**

- `archiveContextAction(contextId)` - Archives a context
- `unarchiveContextAction(contextId)` - Restores an archived context

**Component:** `components/archived-contexts.tsx`

## Completed Tasks Page

Dedicated page for viewing completed tasks with pagination:

**Route:** `/tasks/completed`

**Features:**

- Shows all completed tasks across all contexts
- Displays completion timestamp (date and time)
- Pagination with 20 items per page
- Full task metadata (context, tags, urgency, notes)
- Sortable by completion date (newest first)

**Components:**

- `app/(app)/tasks/completed/page.tsx` - Server Component with pagination
- `components/pagination.tsx` - Reusable pagination UI
- `components/task-card.tsx` - Reused for consistent display

## Settings Pages

User account management:

**Routes:**

- `/settings` - Redirects to `/settings/account`
- `/settings/account` - Account settings (name, email management)

**Features:**

- Profile information editing
- Email verification status
- Account creation date
- Future: Password change, notification preferences

**Components:**

- `app/(app)/settings/account/page.tsx` - Settings page
- `components/account-settings-form.tsx` - Account form UI

## Progressive Web App (PWA)

Unwhelm is a full Progressive Web App with offline support and native features:

**Core Features:**

- Service worker with comprehensive caching strategy
- Installable on iOS, Android, Windows, macOS, Linux
- Offline-first architecture with automatic sync
- Badge API integration for app icon notifications
- Responsive design optimized for mobile and desktop

**Badge API:**
Shows count of due/overdue tasks on the app icon (home screen/dock/taskbar):

- **Implementation:** `lib/badge-utils.ts`, `lib/hooks/use-pwa-badge.ts`
- **Count Logic:** Due today (0 days) or overdue (negative days), excluding completed tasks
- **Habits:** Only counts habits that are "effectively incomplete" (not Fresh status)
- **Permissions:** Requires notification permission on iOS (handled automatically)
- **Auto-Update:** Refreshes every 5 minutes, on visibility change, and on focus
- **Component:** `components/badge-permission-banner.tsx` for permission prompts
- **API Route:** `app/api/badge/route.ts` for server-side badge updates

**Caching Strategy (next.config.ts):**

- **Fonts:** CacheFirst with 365-day expiration
- **Images:** StaleWhileRevalidate with 24-hour expiration
- **API calls:** NetworkFirst with 10-second timeout fallback
- **Static assets:** StaleWhileRevalidate for JS/CSS
- **Service worker:** Disabled in development, enabled in production

**Installation:**

- Configured via `next-pwa` package
- Service worker registered automatically
- Manifest and icons in `/public` directory
- Support for all major platforms and browsers

**Badge Permission Flow:**

1. User visits app, banner prompts for badge permission (iOS only)
2. Granting notification permission enables badge API
3. Badge automatically updates with task count
4. Banner can be dismissed and won't show again for 7 days

## Natural Language Task Parsing

The `lib/utils.ts:parseTags()` function extracts:

- `!context` - Context name
- `#tag` - Tags
- `p1`/`p2`/`p3` - Priority (high/medium/low)
- Date expressions via `chrono-node` (tomorrow, next monday, 2024-12-25)

Used in the smart task input component.

## Code Style (from Cursor rules)

**TypeScript/React:**

- Functional and declarative patterns, avoid classes
- Descriptive variable names with auxiliary verbs (isLoading, hasError)
- Use Server Components by default, minimize `'use client'`
- Early returns for error conditions, guard clauses for validation
- Directory names: lowercase-with-dashes

**Tailwind CSS:**

- Use `bg-color/opacity` format (e.g., `bg-white/30`, `bg-red-300/10`)
- Never use `border` without a color, or omit it entirely
- Mobile-first responsive design

**Git Commits:**

- Use conventional commit format (feat:, fix:, docs:, etc.)

## Documentation Updates

When making significant changes, update these files in `/docs/`:

- `design-decisions.md` - Add new UX decisions or update reasoning
- `ui-patterns.md` - Update component patterns and examples

**Triggers for documentation updates:**

- Creating new component patterns
- Changing visual designs
- Making UX decisions
- Adding task/habit behaviors
- Modifying urgency calculation
- Changing context health system

## Testing

- Jest configuration in `jest.config.js`
- Unit tests in `lib/__tests__/` for utilities
- Test habit logic, urgency calculation, and date utilities
- Run tests before committing: `npm test`

## Authentication

NextAuth.js v4 with credentials provider:

- Configuration in `lib/auth.ts`
- Demo account (optional): demo@unwhelm.app / password123 (enabled via `ENABLE_DEMO_USER` flag)
- Passwords hashed with bcryptjs
- Session checking: `getServerSession(authOptions)`

## Common Patterns

**Server Action Pattern:**

```typescript
export async function myAction(data: FormData) {
  "use server";
  const userId = await getAuthenticatedUser(); // Handles redirect if not logged in
  // ... perform mutation
  revalidatePath("/"); // Revalidate cache
}
```

**Optimistic UI Pattern:**

```typescript
const [isPending, startTransition] = useTransition();

function handleToggle(taskId: string) {
  // Optimistic update
  setTasks((prev) =>
    prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
  );

  startTransition(async () => {
    await toggleTaskAction(taskId);
  });
}
```

**Data Fetching Pattern:**

```typescript
// In Server Component (app/page.tsx)
const tasks = await getTasks();
const contexts = await getContexts();
return <DashboardClient tasks={tasks} contexts={contexts} />;
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/unwhelm"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration (required for email features)
EMAIL_PROVIDER="resend"  # Options: "resend" or "smtp"
EMAIL_FROM="noreply@yourdomain.com"

# For Resend (if EMAIL_PROVIDER="resend")
RESEND_API_KEY="re_123456789"

# For SMTP (if EMAIL_PROVIDER="smtp")
SMTP_HOST="smtp.yourmailserver.com"
SMTP_PORT="587"  # Default: 587 (or 465 for SSL)
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
SMTP_SECURE="false"  # Optional: "true" for SSL/TLS (default: false for 587, true for 465)

# Demo User Feature Flag
ENABLE_DEMO_USER="true"  # Set to "true" to enable demo user (creates during seed and shows on login form)
```

## Feature Limits

Resource limits are configurable per user (potential for subscription tiers):

**Configuration:** `lib/feature-limits.ts`

- `MAX_TASKS` - Currently set to `Infinity` (unlimited)
- `MAX_CONTEXTS` - Currently set to `Infinity` (unlimited)

**Server-side Enforcement:**

- Checked in server actions before creating new resources
- Returns error messages from `FEATURE_LIMIT_ERRORS` when limits exceeded
- Ready for future subscription tier implementation

## Burndown Chart

Task completion visualization over time:

**Component:** `components/burndown-chart.tsx`

**Features:**

- Uses Recharts library for data visualization
- Shows task creation vs. completion trends
- Tracks total pending tasks over the past 30 days
- Empty state with helpful messaging
- Statistics summary (total created, completed, pending)

**Data Structure:**

```typescript
interface BurndownDataPoint {
  date: string; // YYYY-MM-DD format
  createdTasks: number; // Tasks created on this day
  completedTasks: number; // Tasks completed on this day
  pendingTasks: number; // Total pending tasks at end of day
}
```

**Usage:**

- Fetched via `getBurndownData()` from `lib/data.ts`
- Displayed on dashboard or dedicated analytics page
- Helps visualize productivity trends and task accumulation

## Important Notes

- Context health calculation excludes regular tasks (habits only)
- Never use deadline language for habits
- Urgency scoring should be transparent (provide explanations)
- Tasks are sorted by urgency, completed items at bottom
- The "Today" section shows ALL tasks due today from any context
- `waitDays` feature allows delaying urgency increases until N days before due date
- Always use `diffInLocalCalendarDays` from `date-utils.ts` for calendar day calculations (respects local timezone, not UTC)
- Subtasks are stored as JSON and don't affect parent task completion status
- Archived contexts are hidden from main view but remain in database with all tasks intact
- PWA badge shows count of due/overdue tasks (requires notification permission on iOS)
- Service worker is disabled in development mode to avoid caching issues
