<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tress Column Plus+ tables, plus the launch indexer tables.
     *
     * Everything here is off-chain SaaS state, labelled as such in the
     * portal. No subscription, snapshot, alert, or rebate row ever
     * reaches a contract, and no row here changes anything on-chain.
     * The indexer tables hold chain reads (launches, checkpoints);
     * figures drawn from them are labelled on-chain state.
     */
    public function up(): void
    {
        Schema::create('tress_launches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('certificate_id')->unique();
            $table->string('token_address', 42)->index();
            $table->string('creator_address', 42)->index();
            $table->string('locker_address', 42)->nullable();
            $table->string('vesting_vault_address', 42)->nullable();
            $table->string('airdrop_distributor_address', 42)->nullable();
            $table->string('hook_core_address', 42)->nullable();
            $table->string('hook_address', 42)->nullable();
            $table->string('quote_asset_address', 42)->nullable();
            $table->string('total_supply', 78)->default('0');
            $table->string('volume_threshold_quote', 78)->default('0');
            $table->unsignedInteger('pool_fee_tier')->default(0);
            $table->unsignedInteger('lock_mode')->default(0);
            $table->string('unlock_time', 78)->default('0');
            $table->unsignedInteger('vesting_bps')->default(0);
            $table->unsignedInteger('airdrop_bps')->default(0);
            $table->unsignedInteger('liquidity_bps')->default(0);
            $table->unsignedBigInteger('launch_block');
            $table->string('transaction_hash', 66)->nullable();
            $table->timestamps();
        });

        Schema::create('plus_indexer_states', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->unsignedBigInteger('last_block')->default(0);
            $table->unsignedBigInteger('latest_seen')->default(0);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();
        });

        Schema::create('plus_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('tier', 16);
            $table->string('status', 16)->default('active');
            $table->string('provider', 32)->default('test');
            $table->string('provider_mode', 16)->default('test');
            $table->string('provider_reference', 128)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('renews_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('plus_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 128);
            $table->string('token_address', 42);
            $table->unsignedBigInteger('snapshot_block');
            $table->json('filters')->nullable();
            $table->string('status', 16)->default('draft');
            $table->unsignedInteger('holder_count')->default(0);
            $table->string('merkle_root', 66)->nullable();
            $table->json('holders')->nullable();
            $table->json('excluded')->nullable();
            $table->timestamps();
        });

        Schema::create('plus_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->string('target', 128);
            $table->string('threshold_bps', 16)->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            $table->index(['user_id', 'type']);
        });

        Schema::create('plus_airdrop_rebates', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('campaign', 128);
            $table->string('fee_wei', 78)->default('0');
            $table->string('rebate_status', 32)->default('pending');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('plus_support_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('subject', 160);
            $table->text('body');
            $table->string('status', 16)->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plus_support_requests');
        Schema::dropIfExists('plus_airdrop_rebates');
        Schema::dropIfExists('plus_alerts');
        Schema::dropIfExists('plus_snapshots');
        Schema::dropIfExists('plus_subscriptions');
        Schema::dropIfExists('plus_indexer_states');
        Schema::dropIfExists('tress_launches');
    }
};
