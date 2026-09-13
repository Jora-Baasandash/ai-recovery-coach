-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_check_in_id" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_check_in_ids" TEXT[],
    "output" JSONB NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "latency_ms" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_source_check_in_id_fkey" FOREIGN KEY ("source_check_in_id") REFERENCES "check_ins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
