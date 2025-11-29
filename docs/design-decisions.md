# Design Decisions

This document captures the key design decisions made during Todone's development and the reasoning behind them.

## Core Philosophy

### Habits ≠ Tasks ≠ Deadlines

**Decision**: Treat habits as flexible, supportive routines rather than rigid deadlines.

**Reasoning**: Traditional productivity apps create stress by treating missed habits as failures. Todone uses encouraging language like "⚡ Ready" instead of "Overdue" to maintain psychological sustainability.

**Impact**: Habit status language, visual styling, and completion tracking all reflect this supportive approach.

### Context-Based Organization

**Decision**: Organize tasks by context (where/when they're done) rather than projects.

**Reasoning**: Inspired by Getting Things Done methodology. When you're in the bathroom, you want to see bathroom tasks regardless of which "project" they belong to.

**Impact**: Primary navigation is by context, with project information as secondary metadata.

### Urgency Over Priority

**Decision**: Use mathematical urgency scoring instead of simple priority labels.

**Reasoning**: Inspired by TaskWarrior. Urgency can factor in age, due dates, project importance, and tags in a consistent, customizable way.

**Impact**: All sorting is urgency-based, with visual urgency indicators throughout the UI.

## UI Architecture Decisions

### Unified Task Lists

**Decision**: Show habits and tasks in the same list, sorted by urgency.

**Evolution**:

- Started with separate "Habits" and "Tasks" sections
- Tried three sections: "Habits", "Recurring", "Tasks"
- Settled on unified list with visual type indicators

**Reasoning**: Everything competes for attention based on actual urgency. Visual icons distinguish types without artificial separation.

### Context Health from Habits Only

**Decision**: Context completion percentage only considers habits, not one-off tasks.

**Reasoning**: One-off tasks are temporary. Context "health" should reflect how well-maintained that life area is, which comes from consistent habits (cleaning, routines, etc.).

**Impact**: Health bars show habit completion ratio, giving a sense of life balance.

### "Today" Section Priority

**Decision**: Dedicated "Today" section at the top, pulling tasks from all contexts.

**Reasoning**: Due dates create genuine urgency that transcends context boundaries. Today's tasks need immediate visibility regardless of context.

## Visual Design Decisions

### Habit Type Differentiation

**Decision**: Different habit types get different visual treatment.

- **Streak Habits** (🏋️): Prominent red badges with personal bests
- **Learning Habits** (📖): Moderate emphasis with progress ratios
- **Wellness Habits** (🔥): Balanced display
- **Maintenance Habits** (🔧): De-emphasized streaks, focus on frequency

**Reasoning**: Different habits have different motivational patterns. Exercise benefits from streak prominence, while cleaning just needs to get done regularly.

### Relaxed Status Language

**Decision**: Use supportive, non-judgmental language for habit status.

Examples:

- "✓ Fresh" instead of "Completed"
- "⚡ Ready" instead of "Due"
- "🔄 Time for another" instead of "Overdue"

**Reasoning**: Language shapes psychology. Harsh deadline language creates stress and guilt, undermining long-term habit formation.

## Technical Architecture Decisions

### Progressive Web App (PWA)

**Decision**: Build as a full PWA with service worker, offline support, and Badge API integration.

**Reasoning**:

- Task management is used throughout the day across multiple contexts (home, work, mobile)
- Offline support ensures access even without connectivity
- Installability provides native-like experience without app store friction
- Badge API creates persistent awareness of due/overdue tasks

**Impact**:

- Users can install on home screen (iOS/Android) or desktop (Windows/Mac/Linux)
- App badge shows task count even when app is closed
- Service worker caches assets for instant loading
- Works offline with automatic sync when online

**Implementation**: `next-pwa` package with comprehensive caching strategy, `lib/badge-utils.ts` for badge management, permission banner for iOS users.

## Rejected Approaches

### Separate Habit App

**Rejected**: Building habits as a separate app from tasks.

**Reasoning**: Habits and tasks often relate to the same contexts and projects. Unified view provides better life balance perspective.

### Strict Habit Schedules

**Rejected**: Treating habits like recurring tasks with fixed schedules.

**Reasoning**: Creates guilt and stress when missed. Flexible approach is more sustainable long-term.

### Project-First Organization

**Rejected**: Primary navigation by project instead of context.

**Reasoning**: Context-switching is more natural for daily use. Projects span multiple contexts.

### Complex Priority Systems

**Rejected**: Multiple priority dimensions (importance, urgency, effort, etc.).

**Reasoning**: Single urgency score is simpler and can incorporate multiple factors mathematically.

