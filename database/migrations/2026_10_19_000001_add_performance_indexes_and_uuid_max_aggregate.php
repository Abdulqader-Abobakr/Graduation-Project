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
        // 1. PostgreSQL custom aggregate for max(uuid) to support Eloquent ofMany/latestOfMany
        DB::statement('
            CREATE OR REPLACE FUNCTION sila_p.uuid_max(uuid, uuid)
            RETURNS uuid AS $$
            BEGIN
                RETURN GREATEST($1, $2);
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        ');

        DB::statement('
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_aggregate a
                    JOIN pg_proc p ON a.aggfnoid = p.oid
                    JOIN pg_namespace n ON p.pronamespace = n.oid
                    WHERE p.proname = \'max\' AND n.nspname = \'sila_p\'
                ) THEN
                    CREATE AGGREGATE sila_p.max(uuid) (
                        SFUNC = sila_p.uuid_max,
                        STYPE = uuid,
                        COMBINEFUNC = sila_p.uuid_max,
                        PARALLEL = SAFE,
                        SORTOP = >
                    );
                END IF;
            END;
            $$;
        ');

        // 2. High-impact indexes for frequently queried foreign keys, statuses, and dates
        $indexes = [
            'CREATE INDEX IF NOT EXISTS idx_conversations_freelancer_id ON sila_p.conversations (freelancer_id)',
            'CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON sila_p.conversations (client_id)',
            'CREATE INDEX IF NOT EXISTS idx_conversations_brief_id ON sila_p.conversations (brief_id)',
            'CREATE INDEX IF NOT EXISTS idx_projects_freelancer_id ON sila_p.projects (freelancer_id)',
            'CREATE INDEX IF NOT EXISTS idx_projects_client_id ON sila_p.projects (client_id)',
            'CREATE INDEX IF NOT EXISTS idx_projects_status ON sila_p.projects (status)',
            'CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_id ON sila_p.proposals (freelancer_id)',
            'CREATE INDEX IF NOT EXISTS idx_proposals_brief_id ON sila_p.proposals (brief_id)',
            'CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON sila_p.proposals (project_id)',
            'CREATE INDEX IF NOT EXISTS idx_proposals_status ON sila_p.proposals (status)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON sila_p.transactions (project_id)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_verification_created ON sila_p.transactions (verification_status, created_at)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON sila_p.transactions (created_at)',
            'CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_freelancer_id ON sila_p.withdrawal_requests (freelancer_id)',
            'CREATE INDEX IF NOT EXISTS idx_briefs_client_id ON sila_p.briefs (client_id)',
            'CREATE INDEX IF NOT EXISTS idx_briefs_status ON sila_p.briefs (status)',
            'CREATE INDEX IF NOT EXISTS idx_briefs_targeted_freelancer ON sila_p.briefs (targeted_freelancer_id)',
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
            'idx_conversations_freelancer_id',
            'idx_conversations_client_id',
            'idx_conversations_brief_id',
            'idx_projects_freelancer_id',
            'idx_projects_client_id',
            'idx_projects_status',
            'idx_proposals_freelancer_id',
            'idx_proposals_brief_id',
            'idx_proposals_project_id',
            'idx_proposals_status',
            'idx_transactions_project_id',
            'idx_transactions_verification_created',
            'idx_transactions_created_at',
            'idx_withdrawal_requests_freelancer_id',
            'idx_briefs_client_id',
            'idx_briefs_status',
            'idx_briefs_targeted_freelancer',
        ];

        foreach ($indexes as $index) {
            DB::statement("DROP INDEX IF EXISTS sila_p.{$index}");
        }

        DB::statement('DROP AGGREGATE IF EXISTS sila_p.max(uuid)');
        DB::statement('DROP FUNCTION IF EXISTS sila_p.uuid_max(uuid, uuid)');
    }
};
