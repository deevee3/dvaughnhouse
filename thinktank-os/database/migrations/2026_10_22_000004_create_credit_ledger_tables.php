<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * STANZA credit ledger: accounts hold prepaid study/project budgets as
     * off-chain service credits (1 Credit = $0.01 USD peg). Deposits of
     * STANZA on Base are converted at deposit time and recorded in the
     * append-only transaction ledger; the account balance column is kept
     * in sync transactionally with every ledger write.
     */
    public function up(): void
    {
        Schema::create('credit_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('wallet_address')->nullable();
            $table->decimal('balance', 14, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('credit_account_id')->constrained('credit_accounts')->cascadeOnDelete();
            // Signed: positive = credits in (deposit, grant, refund),
            // negative = consumption (attestation debit, adjustments out).
            $table->decimal('amount', 14, 2);
            $table->string('type'); // deposit | grant | attestation | adjustment | refund
            $table->string('blockchain_tx_hash')->nullable();
            $table->unsignedInteger('log_index')->nullable();
            $table->decimal('token_amount', 28, 10)->nullable();
            $table->decimal('token_price_usd', 18, 8)->nullable();
            $table->string('reference')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // A chain deposit is credited exactly once per (tx, log). Postgres
            // treats NULLs as distinct, so manual rows (null hash) never clash.
            $table->unique(['blockchain_tx_hash', 'log_index']);
        });

        Schema::table('manuscripts', function (Blueprint $table) {
            $table->foreignUuid('credit_account_id')->nullable()->after('user_id')
                ->constrained('credit_accounts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manuscripts', function (Blueprint $table) {
            $table->dropForeign(['credit_account_id']);
            $table->dropColumn('credit_account_id');
        });

        Schema::dropIfExists('credit_transactions');
        Schema::dropIfExists('credit_accounts');
    }
};
