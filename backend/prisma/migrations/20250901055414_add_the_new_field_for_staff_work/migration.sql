-- DropForeignKey
ALTER TABLE "StaffWork" DROP CONSTRAINT "StaffWork_workItemId_fkey";

-- AlterTable
ALTER TABLE "StaffWork" ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "workItemId" DROP NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "unitRateNrs" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StaffWork" ADD CONSTRAINT "StaffWork_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
