import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateUrgency, shouldHabitShowAsAvailable } from "@/lib/utils";

export async function GET(request: NextRequest) {
  // Validate Bearer token
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up user by API key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (prisma.user as any).findUnique({
    where: { apiKey: token },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10),
    50
  );

  try {
    const userTags = await prisma.tag.findMany({
      where: { userId: user.id },
    });

    const tagCoefficients: Record<string, number> = {};
    userTags.forEach((tag: { name: string; coefficient: number }) => {
      tagCoefficients[tag.name.toLowerCase()] = tag.coefficient;
    });

    const tasks = await prisma.task.findMany({
      where: { userId: user.id, completed: false },
      include: { context: true },
    });

    const tasksWithUrgency = tasks
      .map((task: {
        id: string;
        title: string;
        priority: string;
        type: string;
        dueDate: Date | null;
        waitDays: number | null;
        createdAt: Date;
        tags: string[];
        completed: boolean;
        completedAt: Date | null;
        habitType: string | null;
        streak: number | null;
        longestStreak: number | null;
        frequency: number | null;
        nextDue: Date | null;
        context: { id: string; name: string; color: string; icon: string; coefficient: number } | null;
      }) => ({
        ...task,
        urgency: calculateUrgency({
          priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
          dueDate: task.dueDate,
          waitDays: task.waitDays,
          createdAt: task.createdAt,
          tags: task.tags,
          contextCoefficient: task.context?.coefficient ?? 0,
          tagCoefficients,
        }),
      }))
      .filter((task) => {
        if (task.type === "HABIT") return shouldHabitShowAsAvailable(task);
        return true;
      })
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, limit);

    const result = tasksWithUrgency.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      type: task.type,
      urgency: Math.round(task.urgency * 10) / 10,
      dueDate: task.dueDate ?? null,
      habitType: task.habitType ?? null,
      streak: task.streak ?? null,
      frequency: task.frequency ?? null,
      context: task.context
        ? {
            id: task.context.id,
            name: task.context.name,
            color: task.context.color,
            icon: task.context.icon,
          }
        : null,
    }));

    return NextResponse.json({
      tasks: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching urgent tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
