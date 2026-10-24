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
        if (Schema::hasColumn('sila_p.users', 'country')) {
            Schema::table('sila_p.users', function (Blueprint $table) {
                $table->dropColumn('country');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('sila_p.users', 'country')) {
            Schema::table('sila_p.users', function (Blueprint $table) {
                $table->string('country')->nullable();
            });
        }
    }
};

