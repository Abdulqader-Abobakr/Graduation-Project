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
        DB::statement("
            ALTER TABLE sila_p.projects
            ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
            ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
            ALTER TABLE sila_p.projects
            DROP COLUMN IF EXISTS rating,
            DROP COLUMN IF EXISTS rated_at;
        ");
    }
};

