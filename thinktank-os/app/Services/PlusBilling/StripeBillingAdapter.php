<?php

namespace App\Services\PlusBilling;

use App\Models\PlusSubscription;
use App\Models\User;

/**
 * Live billing adapter. Refuses to run until the host environment
 * carries a Stripe key AND a price ID for every tier. No price IDs
 * are invented here; empty config means not-configured, and the
 * portal says so instead of offering a checkout.
 */
class StripeBillingAdapter implements BillingAdapterInterface
{
    public function driverName(): string
    {
        return 'stripe';
    }

    public function mode(): string
    {
        return 'live';
    }

    public function isConfigured(): bool
    {
        if (empty(config('services.stripe.key')) || empty(config('services.stripe.secret'))) {
            return false;
        }
        foreach (['sapphire', 'emerald', 'ruby'] as $tier) {
            if (empty(config('plus.stripe.price_'.$tier))) {
                return false;
            }
        }

        return true;
    }

    public function subscribe(User $user, string $tier): PlusSubscription
    {
        if (! $this->isConfigured()) {
            throw new BillingNotConfiguredException(
                'Stripe billing is not configured on this build: a Stripe key and a price ID for every tier are required.'
            );
        }

        // Live Stripe checkout is not wired. Configured keys alone do
        // not start a charge; the checkout session build is a separate
        // step, gated on D'Vaughn picking the billing provider.
        throw new BillingNotConfiguredException(
            'Stripe is configured but live checkout is not wired on this build. No charge was made.'
        );
    }

    public function cancel(PlusSubscription $subscription): void
    {
        throw new BillingNotConfiguredException('Live cancellation is not wired on this build.');
    }
}
