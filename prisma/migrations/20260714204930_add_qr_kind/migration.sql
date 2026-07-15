-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FieldDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'text',
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
INSERT INTO "new_FieldDefinition" ("align", "direction", "fixedValue", "fontFamily", "fontSize", "id", "key", "label", "lang", "order", "printable", "rotationDeg", "source", "templateId", "widthMm", "xMm", "yMm") SELECT "align", "direction", "fixedValue", "fontFamily", "fontSize", "id", "key", "label", "lang", "order", "printable", "rotationDeg", "source", "templateId", "widthMm", "xMm", "yMm" FROM "FieldDefinition";
DROP TABLE "FieldDefinition";
ALTER TABLE "new_FieldDefinition" RENAME TO "FieldDefinition";
CREATE UNIQUE INDEX "FieldDefinition_templateId_key_key" ON "FieldDefinition"("templateId", "key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
