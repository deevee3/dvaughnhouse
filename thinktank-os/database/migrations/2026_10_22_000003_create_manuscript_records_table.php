<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * SpinWave records: the publish-time immutable snapshot of a manuscript.
     * Publishing permanently records the submission on SpinWave (a project
     * of Glenride) — this table is that record. Rows are append-only:
     * a re-publish after a content change adds a new version, nothing is
     * ever updated in place. The only removal is the cascade when the
     * parent manuscript itself is deleted.
     */
    public function up(): void
    {
        Schema::create('manuscript_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('manuscript_id')->constrained('manuscripts')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('record_hash', 64);
            $table->jsonb('snapshot');
            $table->foreignUuid('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['manuscript_id', 'version']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manuscript_records');
    }
};
