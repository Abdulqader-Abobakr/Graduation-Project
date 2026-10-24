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
        Schema::table('sila_p.users', function (Blueprint $table) {
            if (!Schema::hasColumn('sila_p.users', 'alternative_email')) {
                $table->string('alternative_email')->nullable();
            }
            if (!Schema::hasColumn('sila_p.users', 'email_notifications')) {
                $table->boolean('email_notifications')->default(true);
            }
            if (!Schema::hasColumn('sila_p.users', 'remember_token')) {
                $table->rememberToken();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sila_p.users', function (Blueprint $table) {
            $table->dropColumn(['alternative_email', 'email_notifications']);
        });
    }
};

