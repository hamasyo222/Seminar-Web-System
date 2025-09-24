-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "satisfaction_level" TEXT,
    "content_rating" INTEGER,
    "presentation_rating" INTEGER,
    "organization_rating" INTEGER,
    "would_recommend" BOOLEAN NOT NULL DEFAULT false,
    "improvements" TEXT,
    "future_topics" TEXT,
    "other_comments" TEXT,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "surveys_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "surveys_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "surveys_order_id_key" ON "surveys"("order_id");

-- CreateIndex
CREATE INDEX "surveys_session_id_idx" ON "surveys"("session_id");

-- CreateIndex
CREATE INDEX "surveys_submitted_at_idx" ON "surveys"("submitted_at");




