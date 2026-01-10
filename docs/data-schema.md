# Data Schema

## Task Object

```javascript
{
  id: string,
  title: string,
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

## Context Object

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

```

```
