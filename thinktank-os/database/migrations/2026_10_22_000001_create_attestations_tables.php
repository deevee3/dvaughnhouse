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
        Schema::create('attestations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('public_id')->unique();
            $table->uuidMorphs('attestable');
            $table->string('subject_title');
            $table->text('claim');
            $table->json('evidence_manifest')->nullable();
            $table->string('subject_hash');
            $table->string('signature');
            $table->foreignUuid('verifier_id')->constrained('users');
            $table->string('issuer_name')->default('Glenride');
            $table->string('method')->default('editorial_review_v1');
            $table->string('status')->default('issued'); // issued, challenged, revoked
            $table->timestamp('issued_at');
            $table->string('anchor_platform')->nullable(); // tentative: 'pearls'
            $table->string('anchor_chain')->nullable(); // tentative: 'base'
            $table->string('anchor_contract')->nullable();
            $table->string('anchor_tx')->nullable();
            $table->timestamp('anchored_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revocation_reason')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('attestation_challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attestation_id')->constrained('attestations')->cascadeOnDelete();
            $table->foreignUuid('challenger_id')->constrained('users');
            $table->text('grounds');
            $table->string('status')->default('open'); // open, upheld, dismissed
            $table->text('resolution_note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attestation_challenges');
        Schema::dropIfExists('attestations');
    }
};
