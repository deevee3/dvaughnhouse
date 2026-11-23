<?php

namespace App\Services\PlusBilling;

use App\Models\PlusSubscription;
use App\Models\User;

class PlusBilling
{
    public static function adapter(): BillingAdapterInterface
    {
        return match (config('plus.driver', 'test')) {
            'stripe' => new StripeBillingAdapter,
            default => new TestBillingAdapter,
        };
    }

    public static function subscribe(User $user, string $tier): PlusSubscription
    {
        return static::adapter()->subscribe($user, $tier);
    }

    public static function cancel(PlusSubscription $subscription): void
    {
        static::adapter()->cancel($subscription);
    }

    /** Billing state for the portal, honest about what is live. */
    public static function state(): array
    {
        $adapter = static::adapter();

        return [
            'driver' => $adapter->driverName(),
            'mode' => $adapter->mode(),
            'connected' => $adapter->isConfigured() && $adapter->driverName() !== 'test',
            'test_mode' => $adapter->mode() === 'test',
        ];
    }
}
