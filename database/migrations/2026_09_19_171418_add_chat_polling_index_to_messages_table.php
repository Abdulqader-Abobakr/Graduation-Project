<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Composite index to speed up the delta-polling query:
     * SELECT ... FROM sila_p.messages
     * WHERE conversation_id = ? AND created_at > ?
     * ORDER BY created_at ASC
     */
    public function up(): void
    {
        Schema::table('sila_p.messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'created_at'], 'messages_conv_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sila_p.messages', function (Blueprint $table) {
            $table->dropIndex('messages_conv_created_idx');
        });
    }
};
