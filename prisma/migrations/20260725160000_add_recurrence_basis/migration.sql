-- CreateEnum
CREATE TYPE "RecurrenceBasis" AS ENUM ('DUE_DATE', 'COMPLETION_DATE');

-- AlterTable
ALTER TABLE "tasks"
ADD COLUMN "recurrenceBasis" "RecurrenceBasis" NOT NULL DEFAULT 'DUE_DATE';
