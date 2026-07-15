-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "degreeType" TEXT NOT NULL,
    "pageWidthMm" REAL NOT NULL DEFAULT 297,
    "pageHeightMm" REAL NOT NULL DEFAULT 210,
    "backgroundImagePath" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FieldDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT,
    "label" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'LATIN',
    "xMm" REAL NOT NULL DEFAULT 0,
    "yMm" REAL NOT NULL DEFAULT 0,
    "widthMm" REAL NOT NULL DEFAULT 80,
    "fontSize" REAL NOT NULL DEFAULT 11,
    "fontFamily" TEXT NOT NULL DEFAULT 'serif',
    "align" TEXT NOT NULL DEFAULT 'left',
    "direction" TEXT NOT NULL DEFAULT 'ltr',
    "rotationDeg" REAL NOT NULL DEFAULT 0,
    "printable" BOOLEAN NOT NULL DEFAULT true,
    "fixedValue" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FieldDefinition_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
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
    "grade" TEXT,
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

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "studentId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "offsetX" REAL,
    "offsetY" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDefinition_templateId_key_key" ON "FieldDefinition"("templateId", "key");
