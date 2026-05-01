CREATE TYPE "SickLeaveStatus" AS ENUM ('opened', 'closed');

ALTER TABLE "SickLeave" ALTER COLUMN "endDate" DROP NOT NULL;
ALTER TABLE "SickLeave" ALTER COLUMN "days" SET DEFAULT 0;

ALTER TABLE "SickLeave" ADD COLUMN "status_new" "SickLeaveStatus" NOT NULL DEFAULT 'closed';
UPDATE "SickLeave" SET "status_new" = (CASE WHEN "status" = 'draft' THEN 'opened' ELSE 'closed' END)::"SickLeaveStatus";
ALTER TABLE "SickLeave" DROP COLUMN "status";
ALTER TABLE "SickLeave" RENAME COLUMN "status_new" TO "status";
