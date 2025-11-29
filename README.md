# unwhelm

A self-hostable context-based task management app with customizable urgency scoring and flexible habit tracking.

![Screenshot of the main task list](screenshot.png)

## Why I built this

I built this because I was stuck in a loop of trying new task managers, getting slightly behind, and then not sticking with it because the overdue became overwhelming.
I wanted a way to easily see what tasks deserved my attention without the shame of seeing 40 overdue tasks.

unwhelm organises tasks by **context** (kitchen, coding, whatever) and calculates urgency scores so you always know what to work on next.
It also handles habits without making you feel guilty about broken streaks.

## What it does

- **Smart task sorting** - urgency score based on due dates, priority, age, and custom tags. Heavily inspired by TaskWarrior.
- **Context-based organisation** - group tasks by where you do them or what project they belong to. Each context tracks its own "health" based on how well you're keeping up with habits.
- **Add tasks with natural language** - easily add tasks with smart parsing (!context #tags p1 tomorrow)
- **Flexible habits** - Four types with different UI emphasis:
  - Streak habits (exercise) show your current streak prominently
  - Learning habits (reading) have moderate streak display
  - Wellness habits (skincare) balance streaks with frequency
  - Maintenance habits (cleaning) just show when you last did them
- **The basics** - subtasks, recurring tasks, tags, search, archiving contexts, completion history, analytics.

## Key Features

### Task Types

1. **Regular Tasks** - One-off items with due dates and urgency scores
2. **Habits** - Recurring activities with flexible timing and streak tracking
3. **Recurring Tasks** - Scheduled items with strict deadlines (meetings, etc.)

### Habit Types

Different habit types have different UI emphasis:

- **Streak Habits** (exercise, meditation) - Prominent streak display with personal bests
- **Learning Habits** (coding practice, reading) - Moderate streak emphasis
- **Wellness Habits** (skincare, make bed) - Balanced streak and frequency
- **Maintenance Habits** (cleaning) - De-emphasized streaks, focus on "last done"

### Context Health

Each context shows a "health" percentage based only on habit completion (not regular tasks). This represents how well-maintained that area of life is.

### Urgency System

Tasks are sorted by urgency scores that can be customized based on:

- Project importance
- Age of task
- Priority level
- Tags
- Due date proximity

### 🔄 Future Enhancements

- Advanced analytics beyond burndown charts
- Shared contexts for families/roommates
- Offline support

## Quick Start

For detailed setup instructions, see [SETUP.md](./SETUP.md).

**Demo Account:**

- Email: `demo@unwhelm.app`
- Password: `password123`

**Development:**

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Habit Status Language

Habits use relaxed, non-judgmental language:

- **"✓ Fresh"** - Recently completed, no action needed
- **"⏰ Getting due"** - Approaching usual frequency
- **"⚡ Ready"** - Available to do when convenient
- **"🔄 Time for another"** - Past usual frequency but not stressed

## Stack

- **Frontend**: Next.js 15 with App Router, React 19 Server Components, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v4 with credentials provider
- **Styling**: Tailwind CSS + shadcn/ui components
- **Data**: Server-side data fetching with Server Actions
- **Icons**: Lucide React

## Design Principles

1. **Habits ≠ Deadlines** - Habits are flexible and forgiving, not rigid schedules
2. **Context Matters** - Tasks are organized by where/when they're done
3. **Urgency > Priority** - Mathematical urgency scoring beats arbitrary priorities
4. **Natural Language Entry** - Smart parsing of context, tags, priority, and dates
5. **Visual Scanning** - Important information is immediately visible

## Design Reference

The current UI mockup can be found in `/docs/mockup.tsx`. This represents the target design and includes:

- Complete task management interface
- All task types (regular, habits, recurring)
- Context organization with health bars
- Habit status language and visual hierarchy
- Collapsible contexts with unified task lists

Use this mockup as a reference for component structure, styling patterns, and user interaction flows.

## Documentation Maintenance

When making significant changes to the UI or design decisions, please update:

- `/docs/design-decisions.md` - Add new decisions or update reasoning
- `/docs/ui-patterns.md` - Update component patterns and examples
- `/docs/mockup.tsx` - Update if UI significantly changes

This helps maintain context for future development and AI assistance.

## Data Schema

### Task Object

```javascript
{
  id: string,
  title: string,
  project: string,
  priority: 'low' | 'medium' | 'high',
  tags: string[],
  context: string,
  dueDate: string | null,
  urgency: number,
  completed: boolean,
  type: 'task' | 'habit' | 'recurring',

  // Habit-specific fields
  habitType?: 'streak' | 'learning' | 'wellness' | 'maintenance',
  streak?: number,
  longestStreak?: number,
  frequency?: number, // days


  // Recurring-specific fields
  nextDue?: string
}
```

### Context Object

```javascript
{
  id: string,
  name: string,
  description: string,
  icon: string, // Lucide icon name
  color: string, // Tailwind bg class
  shared?: boolean // Future feature
}
```

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:push         # Push schema changes to database
npm run db:seed         # Seed database with sample data
npm run db:migrate      # Run database migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio
```

## Environment Variables

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/unwhelm"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```
