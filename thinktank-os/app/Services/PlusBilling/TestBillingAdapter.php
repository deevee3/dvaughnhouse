<?php

namespace App\Services\PlusBilling;

use App\Models\PlusSubscription;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Test-mode billing. Subscriptions are recorded locally only, labelled
 * test mode, and no money moves. No live payment provider is called.
 * This is the only driver that runs without host configuration.
 */
class TestBillingAdapter implements BillingAdapterInterface
{
    public function driverName(): string
    {
        return 'test';
    }

    public function mode(): string
    {
        return 'test';
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function subscribe(User $user, string $tier): PlusSubscription
    {
        $tier = strtoupper($tier);
        if (! isset(config('plus.tiers')[$tier])) {
            throw new \InvalidArgumentException('Unknown Plus+ tier: '.$tier);
        }

        $active = PlusSubscription::activeFor($user);
        if ($active) {
            $active->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        }

        return PlusSubscription::create([
            'user_id' => $user->id,
            'tier' => $tier,
            'status' => 'active',
            'provider' => 'test',
            'provider_mode' => 'test',
            'provider_reference' => 'test-'.Str::random(12),
            'started_at' => now(),
            'renews_at' => now()->addMonth(),
        ]);
    }

    public function cancel(PlusSubscription $subscription): void
    {
        $subscription->update(['status' => 'cancelled', 'cancelled_at' => now()]);
    }
}
