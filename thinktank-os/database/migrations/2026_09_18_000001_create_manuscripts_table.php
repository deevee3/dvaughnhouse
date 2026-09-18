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
        Schema::create('manuscripts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('abstract')->nullable();
            $table->string('raw_file_path');
            $table->string('synthesized_brief_path')->nullable();
            $table->string('status')->default('submitted'); // submitted, ai_synthesized, human_polish, published
            $table->boolean('compliance_ethics_verified')->default(false);
            $table->boolean('compliance_transparency_verified')->default(false);
            $table->boolean('compliance_citations_verified')->default(false);
            $table->unsignedInteger('word_count')->nullable();
            $table->decimal('grant_amount', 8, 2)->default(500.00);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manuscripts');
    }
};
