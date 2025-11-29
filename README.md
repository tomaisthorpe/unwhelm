# unwhelm

A self-hostable context-based task management app with customizable urgency scoring and flexible habit tracking.

![Screenshot of the main task list](screenshot.png)

## Core Concept

unwhelm is designed to solve the problem of prioritizing work across multiple projects and life areas. Unlike traditional task apps, it uses:

- **Context-based organization** (coding, bathroom, kitchen, etc.)
- **Customizable urgency scoring** (inspired by TaskWarrior)
- **Flexible habit tracking** with different types
- **Natural language task entry** with smart parsing (!context #tags p1 tomorrow)

## Features

**Core Functionality:**

- ✅ Complete task CRUD with Server Actions
- ✅ Context management with health tracking
- ✅ Dynamic urgency calculation
- ✅ Full habit tracking system with 4 habit types
- ✅ PostgreSQL database with Prisma ORM
- ✅ User authentication with NextAuth.js
- ✅ Server-side rendering and data fetching

**Task Management:**

- ✅ Three task types: regular, habits, recurring
- ✅ Urgency scoring based on priority, age, due dates, tags
- ✅ Optimistic UI updates with Server Actions
- ✅ Task completion with habit streak tracking
- ✅ Text-based task entry with natural language parsing
- ✅ Subtasks with drag-and-drop reordering
- ✅ Tag coefficient system for customizable urgency weighting

**UI/UX:**

- ✅ Responsive design with Tailwind CSS + shadcn/ui
- ✅ Context health visualization
- ✅ Collapsible context groups
- ✅ Today section for due tasks
- ✅ Relaxed habit status language
- ✅ Search and filtering across tasks and contexts
- ✅ Context archiving system
- ✅ Completed tasks page with pagination

**Analytics & Insights:**

- ✅ Task burndown chart and completion analytics
- ✅ PWA badge notifications for due tasks
- ✅ Context health tracking and visualization

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
