<?php

namespace App\Http\Controllers;

use App\Models\PlusIndexerState;
use App\Models\PlusSubscription;
use App\Models\TressLaunch;
use App\Services\PlusBilling\PlusBilling;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Plus+ portal, logged-in state.
 *
 * Surface: plus.dvaughnhouse.com, picked Nov 17, 2026. Live there
 * since the Nov 20, 2026 cutover (his tap); staging at /staging/plus
 * stays as the pre-live check.
 *
 * Billing state is reported as a boolean only. Keys are never read
 * into a prop, never printed, never invented. When billing is not
 * connected, the portal says so and offers no payment action.
 * Subscription state here is a real lookup, not a static line.
 */
class PlusPortalController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $subscription = PlusSubscription::activeFor($user);
        $state = PlusIndexerState::for('launches');

        return Inertia::render('PlusPortal/Index', [
            'billing' => PlusBilling::state(),
            'subscription' => $subscription ? [
                'tier' => $subscription->tier,
                'status' => $subscription->status,
                'provider' => $subscription->provider,
                'provider_mode' => $subscription->provider_mode,
                'started_at' => $subscription->started_at?->toIso8601String(),
                'renews_at' => $subscription->renews_at?->toIso8601String(),
                'price_monthly' => config('plus.tiers.'.$subscription->tier.'.price_monthly'),
            ] : null,
            'entitlement' => $subscription?->tier,
            'indexer' => [
                'launch_count' => TressLaunch::count(),
                'last_block' => $state->last_block,
                'latest_seen' => $state->latest_seen,
                'last_run_at' => $state->last_run_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Vanity certificate URL: /p/<tokenId> resolves to the same
     * certificate record, on the launch page. Cosmetic only.
     */
    public function vanity(int $tokenId)
    {
        if (request()->getHost() === 'plus.dvaughnhouse.com') {
            return redirect('https://tc.dvaughnhouse.com/launches/'.$tokenId);
        }

        return redirect('https://dvaughnhouse.org/staging/tress-column/launches/'.$tokenId);
    }
}
