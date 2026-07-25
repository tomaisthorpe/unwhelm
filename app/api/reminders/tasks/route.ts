import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDueAndOverdueTaskCounts } from "@/lib/badge-utils";
import { prisma } from "@/lib/prisma";
import {
  isPushoverConfigured,
  sendPushoverMessage,
} from "@/lib/pushover";
import {
  getTaskReminderMessage,
  isTaskReminderDue,
} from "@/lib/task-reminder";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest, secret: string) {
  const authorization = request.headers.get("authorization");
  const supplied = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return NextResponse.json(
      { error: "Reminder service is not configured" },
      { status: 503 }
    );
  }

  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushoverConfigured()) {
    console.error("Pushover is not configured");
    return NextResponse.json(
      { error: "Reminder service is not configured" },
      { status: 503 }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      taskReminderEnabled: true,
      pushoverUserKey: { not: null },
    },
    select: {
      id: true,
      pushoverUserKey: true,
      taskReminderTimeZone: true,
      taskReminderHour: true,
      taskReminderLastSentAt: true,
      tasks: {
        select: {
          completed: true,
          completedAt: true,
          dueDate: true,
          type: true,
        },
      },
    },
  });

  const now = new Date();
  const baseUrl = (
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://unwhelm.app"
  ).replace(/\/$/, "");
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users) {
    if (
      !isTaskReminderDue(
        {
          timeZone: user.taskReminderTimeZone,
          hour: user.taskReminderHour,
          lastSentAt: user.taskReminderLastSentAt,
        },
        now
      )
    ) {
      skipped += 1;
      continue;
    }

    const counts = getDueAndOverdueTaskCounts(
      user.tasks,
      now,
      user.taskReminderTimeZone
    );
    if (counts.total === 0) {
      skipped += 1;
      continue;
    }

    const reminder = getTaskReminderMessage(counts);

    try {
      await sendPushoverMessage({
        user: user.pushoverUserKey!,
        ...reminder,
        title: `Unwhelm: ${reminder.title}`,
        url: `${baseUrl}/tasks`,
        urlTitle: "Open task list",
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { taskReminderLastSentAt: now },
      });
      sent += 1;
    } catch (error) {
      console.error(`Failed to send task reminder for user ${user.id}:`, error);
      errors.push(user.id);
    }
  }

  return NextResponse.json(
    { users: users.length, sent, skipped, failed: errors.length },
    { status: errors.length > 0 ? 502 : 200 }
  );
}
