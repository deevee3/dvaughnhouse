<?php

namespace App\Services\PlusBilling;

use App\Models\PlusSubscription;
use App\Models\User;

interface BillingAdapterInterface
{
    public function driverName(): string;

    public function mode(): string;

    public function isConfigured(): bool;

    public function subscribe(User $user, string $tier): PlusSubscription;

    public function cancel(PlusSubscription $subscription): void;
}
