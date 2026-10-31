// Add new updates at the top. Dates use YYYY-MM-DD; copy is written for users.
export const changelog = [
  {
    date: "2026-10-31",
    changes: [
      "You're now signed in automatically after creating an account.",
      "Added a footer with contact, source and changelog links.",
      "Fixed the repeat basis selector being hard to read in dark mode.",
    ],
  },
  {
    date: "2026-10-10",
    changes: [
      "New Focus view: pick the tasks you want to work on today and see them together.",
      'Added timezone and daily reset time to account settings, so "today" matches your day.',
    ],
  },
  {
    date: "2026-09-18",
    changes: [
      "Task cards and context headings are more compact on mobile.",
      "Added a toggle in the Focus header to switch between urgency and due date.",
      "Creating a task, habit or recurring task now opens a form specific to that type.",
    ],
  },
] as const;
