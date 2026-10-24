<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sila_p.conversations', function (Blueprint $table) {
            if (!Schema::hasColumn('sila_p.conversations', 'client_read_at')) {
                $table->timestampWithTimeZone('client_read_at')->nullable();
            }
            if (!Schema::hasColumn('sila_p.conversations', 'freelancer_read_at')) {
                $table->timestampWithTimeZone('freelancer_read_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sila_p.conversations', function (Blueprint $table) {
            $table->dropColumn(['client_read_at', 'freelancer_read_at']);
        });
    }
};

