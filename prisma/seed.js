import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if demo user should be created
  const enableDemoUser = process.env.ENABLE_DEMO_USER === "true";

  if (!enableDemoUser) {
    console.log("Demo user creation is disabled (ENABLE_DEMO_USER=false)");
    return;
  }

  // Create a demo user
  const hashedPassword = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@unwhelm.app" },
    update: {},
    create: {
      email: "demo@unwhelm.app",
      name: "Demo User",
      password: hashedPassword,
    },
  });

  console.log("Created user:", user.email);

  // Create contexts including inbox
  const contexts = await Promise.all([
    prisma.context.upsert({
      where: { id: "inbox-context" },
      update: {},
      create: {
        id: "inbox-context",
        name: "Inbox",
        description: "Default context for new tasks",
        icon: "Inbox",
        color: "bg-blue-500",
        isInbox: true,
        userId: user.id,
      },
    }),
    prisma.context.upsert({
      where: { id: "coding-context" },
      update: {},
      create: {
        id: "coding-context",
        name: "Coding",
        description: "Development work",
        icon: "Code",
        color: "bg-green-500",
        userId: user.id,
      },
    }),
    prisma.context.upsert({
      where: { id: "bathroom-context" },
      update: {},
      create: {
        id: "bathroom-context",
        name: "Bathroom",
        description: "Bathroom tasks & cleaning",
        icon: "Home",
        color: "bg-cyan-500",
        userId: user.id,
      },
    }),
    prisma.context.upsert({
      where: { id: "kitchen-context" },
      update: {},
      create: {
        id: "kitchen-context",
        name: "Kitchen",
        description: "Kitchen & cooking tasks",
        icon: "Coffee",
        color: "bg-green-500",
        userId: user.id,
      },
    }),
    prisma.context.upsert({
      where: { id: "bedroom-context" },
      update: {},
      create: {
        id: "bedroom-context",
        name: "Bedroom",
        description: "Bedroom & sleep routine",
        icon: "Home",
        color: "bg-purple-500",
        userId: user.id,
      },
    }),
  ]);

  console.log("Created contexts:", contexts.length);

  // Create tasks
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tasks = [
    // Today's priority tasks
    {
      id: "task-1",
      title: "Fix authentication bug in user dashboard",
      project: "SideProject A",
      priority: "HIGH",
      tags: ["bug", "urgent"],
      contextId: "coding-context",
      dueDate: today,
      completed: false,
      type: "TASK",
      userId: user.id,
    },
    {
      id: "habit-1",
      title: "Morning workout",
      project: "Health",
      priority: "MEDIUM",
      tags: ["fitness"],
      contextId: "bedroom-context",
      dueDate: today,
      completed: true,
      completedAt: today,
      type: "HABIT",
      habitType: "STREAK",
      streak: 12,
      longestStreak: 28,
      frequency: 1,
      userId: user.id,
    },

    // Coding context
    {
      id: "task-2",
      title: "Deploy staging environment",
      project: "SideProject A",
      priority: "HIGH",
      tags: ["deployment"],
      contextId: "coding-context",
      dueDate: tomorrow,
      completed: false,
      type: "TASK",
      userId: user.id,
    },
    {
      id: "task-3",
      title: "Review pull requests",
      project: "SideProject B",
      priority: "MEDIUM",
      tags: ["review"],
      contextId: "coding-context",
      dueDate: null,
      completed: true,
      completedAt: today,
      type: "TASK",
      userId: user.id,
    },
    {
      id: "habit-2",
      title: "Daily coding practice",
      project: "Learning",
      priority: "MEDIUM",
      tags: ["learning", "coding"],
      contextId: "coding-context",
      dueDate: null,
      completed: false,
      type: "HABIT",
      habitType: "LEARNING",
      streak: 7,
      longestStreak: 15,
      frequency: 1,
      userId: user.id,
    },
    {
      id: "recurring-1",
      title: "Weekly team standup",
      project: "Work",
      priority: "MEDIUM",
      tags: ["meeting", "recurring"],
      contextId: "coding-context",
      dueDate: tomorrow,
      completed: false,
      type: "RECURRING",
      frequency: 7,
      nextDue: tomorrow,
      userId: user.id,
    },

    // Kitchen context
    {
      id: "habit-3",
      title: "Wipe down counters",
      project: "Cleaning",
      priority: "MEDIUM",
      tags: ["cleaning"],
      contextId: "kitchen-context",
      dueDate: today,
      completed: true,
      completedAt: today,
      type: "HABIT",
      habitType: "MAINTENANCE",
      streak: 5,
      frequency: 1,
      userId: user.id,
    },
    {
      id: "task-4",
      title: "Empty dishwasher",
      project: "Cleaning",
      priority: "MEDIUM",
      tags: ["dishes"],
      contextId: "kitchen-context",
      dueDate: today,
      completed: false,
      type: "TASK",
      userId: user.id,
    },

    // Bedroom context
    {
      id: "habit-4",
      title: "Make bed",
      project: "Morning Routine",
      priority: "LOW",
      tags: ["routine"],
      contextId: "bedroom-context",
      dueDate: null,
      completed: true,
      completedAt: today,
      type: "HABIT",
      habitType: "WELLNESS",
      streak: 8,
      longestStreak: 22,
      frequency: 1,
      userId: user.id,
    },
    {
      id: "habit-5",
      title: "Read before bed",
      project: "Learning",
      priority: "LOW",
      tags: ["reading", "routine"],
      contextId: "bedroom-context",
      dueDate: null,
      completed: false,
      type: "HABIT",
      habitType: "LEARNING",
      streak: 9,
      longestStreak: 18,
      frequency: 1,
      userId: user.id,
    },

    // Bathroom context
    {
      id: "habit-6",
      title: "Evening skincare routine",
      project: "Self-Care",
      priority: "LOW",
      tags: ["skincare", "routine"],
      contextId: "bathroom-context",
      dueDate: null,
      completed: false,
      type: "HABIT",
      habitType: "WELLNESS",
      streak: 18,
      longestStreak: 32,
      frequency: 1,
      userId: user.id,
    },

    // Task completed yesterday (should be hidden)
    {
      id: "task-completed-yesterday",
      title: "Task completed yesterday (should be hidden)",
      project: "Testing",
      priority: "LOW",
      tags: ["test"],
      contextId: "bathroom-context",
      dueDate: yesterday,
      completed: true,
      completedAt: yesterday,
      type: "TASK",
      userId: user.id,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.upsert({
      where: { id: taskData.id },
      update: {},
      create: taskData,
    });
  }

  console.log("Created tasks:", tasks.length);

  // Create some habit completion records
  const completionRecords = [
    { taskId: "habit-1", completedAt: today },
    { taskId: "habit-3", completedAt: today },
    { taskId: "habit-4", completedAt: today },
    { taskId: "habit-2", completedAt: yesterday },
    { taskId: "habit-5", completedAt: yesterday },
    { taskId: "habit-6", completedAt: yesterday },
  ];

  for (const record of completionRecords) {
    await prisma.habitCompletion.create({
      data: record,
    });
  }

  console.log("Created habit completion records:", completionRecords.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
