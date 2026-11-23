<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only issuance log for the Witness attestation layer.
     *
     * Every issued attestation gets the next sequence number (monotonic,
     * gap-free, enforced by the unique constraint on `seq`). Each entry
     * links to the previous entry's hash, forming a tamper-evident chain
     * anchored at an explicit genesis entry (seq 0). Held items never get
     * a sequence number; duplicate triggers create no new entry.
     *
     * See ATTESTATION-PROTOCOL.md §9 (Serialization) for the scheme.
     */
    public function up(): void
    {
        Schema::create('attestation_issuance_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('seq')->unique();
            $table->string('prev_hash', 64);
            $table->string('public_id');
            $table->string('subject_hash', 64);
            $table->json('gates_passed');
            $table->timestamp('issued_at');
            $table->string('human_principal');
            $table->text('authorization');
            $table->string('entry_hash', 64)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attestation_issuance_log');
    }
};
