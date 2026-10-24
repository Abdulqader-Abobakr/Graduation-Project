<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sila_p.users', function (Blueprint $table) {
            if (! Schema::hasColumn('sila_p.users', 'country')) {
                $table->string('country')->nullable();
            }

            if (! Schema::hasColumn('sila_p.users', 'id_document_path')) {
                $table->text('id_document_path')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('sila_p.users', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('sila_p.users', 'country')) {
                $columns[] = 'country';
            }

            if (Schema::hasColumn('sila_p.users', 'id_document_path')) {
                $columns[] = 'id_document_path';
            }

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};