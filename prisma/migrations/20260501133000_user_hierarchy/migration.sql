ALTER TABLE "User" ADD COLUMN "managerId" TEXT;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';

UPDATE "User" SET "role" = 'user' WHERE "role" = 'employee';

CREATE INDEX "User_department_idx" ON "User"("department");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_managerId_idx" ON "User"("managerId");

ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
