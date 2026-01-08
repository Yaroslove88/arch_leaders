-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "participants" TEXT[],
    "context_json" JSONB,
    "file_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "insights_json" JSONB NOT NULL,
    "focus_json" JSONB NOT NULL,
    "themes" TEXT[],
    "patterns" TEXT[],
    "tensions" TEXT[],
    "ability_signals_json" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "analysis_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "analyzed_at" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "steps_json" JSONB NOT NULL DEFAULT '[]',
    "criteria_json" JSONB NOT NULL,
    "reward_json" JSONB,
    "linked_nodes" TEXT[],
    "evidence_links_json" JSONB NOT NULL DEFAULT '[]',
    "due_hint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "source" TEXT,
    "tags" TEXT[],
    "session_id" TEXT,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "quest_id" TEXT,
    "ability_node_id" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_semantic" (
    "id" TEXT NOT NULL DEFAULT 'tree_main',
    "semantic_version" TEXT NOT NULL DEFAULT '1.0.0',
    "tree_revision" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "integrity_hash" TEXT,

    CONSTRAINT "tree_semantic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_layout" (
    "id" TEXT NOT NULL,
    "tree_id" TEXT NOT NULL DEFAULT 'tree_main',
    "layout_version" TEXT NOT NULL DEFAULT '1.0.0',
    "layout_revision" INTEGER NOT NULL DEFAULT 1,
    "computed_from_tree_revision" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrity_hash" TEXT,

    CONSTRAINT "tree_layout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelog" (
    "id" TEXT NOT NULL,
    "change_id" TEXT NOT NULL,
    "tree_revision" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "links_json" JSONB NOT NULL DEFAULT '[]',
    "ops_json" JSONB NOT NULL,
    "inverse_ops_json" JSONB,

    CONSTRAINT "changelog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_settings" (
    "id" TEXT NOT NULL DEFAULT 'telegram_main',
    "chat_id" TEXT,
    "bot_token" TEXT,
    "enabled_post_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "morning_time" TEXT,
    "evening_time" TEXT,
    "timezone" TEXT DEFAULT 'Europe/Moscow',
    "tone_sarcasm" INTEGER NOT NULL DEFAULT 35,
    "no_quotes_mode" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_created_at_idx" ON "Entry"("created_at");

-- CreateIndex
CREATE INDEX "Entry_type_idx" ON "Entry"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Session_entry_id_key" ON "Session"("entry_id");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_created_at_idx" ON "Session"("created_at");

-- CreateIndex
CREATE INDEX "Quest_status_idx" ON "Quest"("status");

-- CreateIndex
CREATE INDEX "Quest_created_at_idx" ON "Quest"("created_at");

-- CreateIndex
CREATE INDEX "Evidence_quest_id_idx" ON "Evidence"("quest_id");

-- CreateIndex
CREATE INDEX "Evidence_ability_node_id_idx" ON "Evidence"("ability_node_id");

-- CreateIndex
CREATE INDEX "Evidence_created_at_idx" ON "Evidence"("created_at");

-- CreateIndex
CREATE INDEX "tree_layout_tree_id_computed_from_tree_revision_idx" ON "tree_layout"("tree_id", "computed_from_tree_revision");

-- CreateIndex
CREATE UNIQUE INDEX "changelog_change_id_key" ON "changelog"("change_id");

-- CreateIndex
CREATE INDEX "changelog_change_id_idx" ON "changelog"("change_id");

-- CreateIndex
CREATE INDEX "changelog_tree_revision_idx" ON "changelog"("tree_revision");

-- CreateIndex
CREATE INDEX "changelog_created_at_idx" ON "changelog"("created_at");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
