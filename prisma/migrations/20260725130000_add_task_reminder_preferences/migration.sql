-- AlterTable
ALTER TABLE "users"
ADD COLUMN "taskReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pushoverUserKey" TEXT,
ADD COLUMN "taskReminderTimeZone" TEXT NOT NULL DEFAULT 'Europe/London',
ADD COLUMN "taskReminderHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN "taskReminderLastSentAt" TIMESTAMP(3);
