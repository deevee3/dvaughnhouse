<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * V2: attestation is embedded in the manuscript process and also
     * supports standalone manual subjects. The attestable morph becomes
     * nullable so a record can exist without a pipeline subject, and
     * the subject kind / entry path are recorded explicitly.
     */
    public function up(): void
    {
        Schema::table('attestations', function (Blueprint $table) {
            $table->string('attestable_type')->nullable()->change();
            $table->uuid('attestable_id')->nullable()->change();
            $table->string('subject_kind')->default('manuscript')->after('attestable_id');
            $table->string('entered_via')->default('pipeline')->after('subject_kind');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attestations', function (Blueprint $table) {
            $table->dropColumn(['subject_kind', 'entered_via']);
        });

        Schema::table('attestations', function (Blueprint $table) {
            $table->string('attestable_type')->nullable(false)->change();
            $table->uuid('attestable_id')->nullable(false)->change();
        });
    }
};
