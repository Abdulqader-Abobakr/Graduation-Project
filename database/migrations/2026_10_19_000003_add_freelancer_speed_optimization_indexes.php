<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $indexes = [
            'CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc ON sila_p.messages (conversation_id, created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_conversations_freelancer_unread ON sila_p.conversations (freelancer_id, unread_count)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_project_verified_created ON sila_p.transactions (project_id, verification_status, created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_briefs_status_targeted_created ON sila_p.briefs (status, targeted_freelancer_id, created_at DESC)',
        ];

        foreach ($indexes as $sql) {
            DB::statement($sql);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $indexes = [
            'idx_messages_conv_created_desc',
            'idx_conversations_freelancer_unread',
            'idx_transactions_project_verified_created',
            'idx_briefs_status_targeted_created',
        ];

        foreach ($indexes as $index) {
            DB::statement("DROP INDEX IF EXISTS sila_p.{$index}");
        }
    }
};
