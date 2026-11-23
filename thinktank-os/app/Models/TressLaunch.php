<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TressLaunch extends Model
{
    protected $fillable = [
        'certificate_id', 'token_address', 'creator_address',
        'locker_address', 'vesting_vault_address',
        'airdrop_distributor_address', 'hook_core_address', 'hook_address',
        'quote_asset_address', 'total_supply', 'volume_threshold_quote',
        'pool_fee_tier', 'lock_mode', 'unlock_time', 'vesting_bps',
        'airdrop_bps', 'liquidity_bps', 'launch_block', 'transaction_hash',
    ];

    protected $casts = [
        'certificate_id' => 'integer',
        'pool_fee_tier' => 'integer',
        'lock_mode' => 'integer',
        'vesting_bps' => 'integer',
        'airdrop_bps' => 'integer',
        'liquidity_bps' => 'integer',
        'launch_block' => 'integer',
    ];

    /** "Pure" feed rule, public and versioned: Abyssal lock, no vesting, guards on. */
    public function isPure(): bool
    {
        return $this->lock_mode === 0 && $this->vesting_bps === 0;
    }
}
