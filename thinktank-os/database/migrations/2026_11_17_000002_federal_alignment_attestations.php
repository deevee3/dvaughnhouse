<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Federal-alignment columns (protocol v2.0, November 17, 2026):
     * asymmetric signature method + key ID, independent timestamp,
     * authorization evidence, and correction linkage on attestations;
     * plus a database-level append-only guard on the issuance log.
     *
     * All new attestation columns are nullable (or defaulted) so the
     * already-issued HMAC record keeps verifying exactly as issued:
     * a null signature_method means the legacy HMAC path.
     */
    public function up(): void
    {
        Schema::table('attestations', function (Blueprint $table) {
            $table->string('signature_method')->nullable()->after('signature');
            $table->string('key_id')->nullable()->after('signature_method');
            $table->text('timestamp_token')->nullable()->after('key_id');
            $table->timestamp('timestamped_at')->nullable()->after('timestamp_token');
            $table->string('timestamp_source')->nullable()->after('timestamped_at');
            $table->string('timestamp_status')->nullable()->after('timestamp_source');
            $table->text('authorization_evidence')->nullable()->after('timestamp_status');
            $table->foreignUuid('supersedes_id')->nullable()->after('revocation_reason')->constrained('attestations');
            $table->unsignedInteger('version')->default(1)->after('supersedes_id');
        });

        // Database-level append-only enforcement for the issuance log
        // (Postgres only; SQLite test runs rely on the model guards
        // and on chain verification detecting tampering).
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared(<<<'SQL'
                CREATE OR REPLACE FUNCTION prevent_issuance_log_mutation()
                RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'attestation_issuance_log is append-only: UPDATE and DELETE are refused';
                    RETURN NULL;
                END;
                $$ LANGUAGE plpgsql;
                DROP TRIGGER IF EXISTS issuance_log_no_update_delete ON attestation_issuance_log;
                CREATE TRIGGER issuance_log_no_update_delete
                BEFORE UPDATE OR DELETE ON attestation_issuance_log
                FOR EACH ROW EXECUTE FUNCTION prevent_issuance_log_mutation();
            SQL);
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared(<<<'SQL'
                DROP TRIGGER IF EXISTS issuance_log_no_update_delete ON attestation_issuance_log;
                DROP FUNCTION IF EXISTS prevent_issuance_log_mutation();
            SQL);
        }

        Schema::table('attestations', function (Blueprint $table) {
            $table->dropForeign(['supersedes_id']);
            $table->dropColumn([
                'signature_method',
                'key_id',
                'timestamp_token',
                'timestamped_at',
                'timestamp_source',
                'timestamp_status',
                'authorization_evidence',
                'supersedes_id',
                'version',
            ]);
        });
    }
};
