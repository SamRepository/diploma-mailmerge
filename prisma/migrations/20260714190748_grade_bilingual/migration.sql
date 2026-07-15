/*
  Warnings:

  - You are about to drop the column `grade` on the `Student` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT,
    "nameLatin" TEXT NOT NULL,
    "nameArabic" TEXT,
    "birthDate" TEXT,
    "birthPlaceLatin" TEXT,
    "birthPlaceArabic" TEXT,
    "domainLatin" TEXT,
    "domainArabic" TEXT,
    "branchLatin" TEXT,
    "branchArabic" TEXT,
    "specialityLatin" TEXT,
    "specialityArabic" TEXT,
    "gradeLatin" TEXT,
    "gradeArabic" TEXT,
    "centerLatin" TEXT,
    "centerArabic" TEXT,
    "issuePlace" TEXT,
    "issueDate" TEXT,
    "serialNumber" TEXT,
    "registrationCode" TEXT,
    "printStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "printedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("birthDate", "birthPlaceArabic", "birthPlaceLatin", "branchArabic", "branchLatin", "centerArabic", "centerLatin", "createdAt", "domainArabic", "domainLatin", "id", "issueDate", "issuePlace", "nameArabic", "nameLatin", "printStatus", "printedAt", "registrationCode", "serialNumber", "specialityArabic", "specialityLatin", "templateId", "updatedAt") SELECT "birthDate", "birthPlaceArabic", "birthPlaceLatin", "branchArabic", "branchLatin", "centerArabic", "centerLatin", "createdAt", "domainArabic", "domainLatin", "id", "issueDate", "issuePlace", "nameArabic", "nameLatin", "printStatus", "printedAt", "registrationCode", "serialNumber", "specialityArabic", "specialityLatin", "templateId", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
