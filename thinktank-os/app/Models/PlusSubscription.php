<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlusSubscription extends Model
{
    protected $fillable = [
        'user_id', 'tier', 'status', 'provider', 'provider_mode',
        'provider_reference', 'started_at', 'renews_at', 'cancelled_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'renews_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function tierRank(): int
    {
        return (int) (config('plus.tiers.'.$this->tier.'.rank') ?? 0);
    }

    public static function activeFor(?User $user): ?self
    {
        if (! $user) {
            return null;
        }

        return static::where('user_id', $user->id)
            ->where('status', 'active')
            ->latest('id')
            ->first();
    }

    /** Does this subscription grant at least the named tier? */
    public function grants(string $tier): bool
    {
        $wanted = (int) (config('plus.tiers.'.strtoupper($tier).'.rank') ?? 0);

        return $this->isActive() && $this->tierRank() >= $wanted && $wanted > 0;
    }
}
