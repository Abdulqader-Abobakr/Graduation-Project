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
            'CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON sila_p.deliverables (project_id)',
            'CREATE INDEX IF NOT EXISTS idx_proposal_milestones_proposal_id ON sila_p.proposal_milestones (proposal_id)',
            'CREATE INDEX IF NOT EXISTS idx_portfolios_freelancer_id ON sila_p.portfolios (freelancer_id)',
            'CREATE INDEX IF NOT EXISTS idx_conversations_freelancer_updated ON sila_p.conversations (freelancer_id, updated_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_conversations_client_updated ON sila_p.conversations (client_id, updated_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_projects_freelancer_status ON sila_p.projects (freelancer_id, status)',
            'CREATE INDEX IF NOT EXISTS idx_projects_freelancer_updated ON sila_p.projects (freelancer_id, updated_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_created ON sila_p.proposals (freelancer_id, created_at DESC)',
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
            'idx_deliverables_project_id',
            'idx_proposal_milestones_proposal_id',
            'idx_portfolios_freelancer_id',
            'idx_conversations_freelancer_updated',
            'idx_conversations_client_updated',
            'idx_projects_freelancer_status',
            'idx_projects_freelancer_updated',
            'idx_proposals_freelancer_created',
        ];

        foreach ($indexes as $index) {
            DB::statement("DROP INDEX IF EXISTS sila_p.{$index}");
        }
    }
};
