<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tress Column Plus+ — billing
    |--------------------------------------------------------------------------
    |
    | Locked price sheet (settled 2026-10-25): Sapphire $7/mo, Emerald
    | $27/mo, Ruby $97/mo. Monthly only. No annual pricing until billing
    | exists. Passes buy tools, sight, and time. Nothing a pass unlocks
    | touches a contract, a lock, a fee, or anyone else's launch.
    |
    | Billing runs through a pluggable adapter. The default driver is
    | "test": subscriptions are recorded locally, labelled test mode,
    | and no money moves, no live payment provider is called, and no
    | live Stripe product or price is invented. The "stripe" driver
    | refuses to run until a Stripe key AND per-tier price IDs are
    | configured in the host environment; empty config means the
    | driver reports not-configured and the portal says so.
    */
    'driver' => env('PLUS_BILLING_DRIVER', 'test'),

    'mode' => env('PLUS_BILLING_MODE', 'test'),

    'tiers' => [
        'SAPPHIRE' => ['name' => 'Sapphire', 'price_monthly' => 7, 'target' => 'Trader', 'rank' => 1],
        'EMERALD' => ['name' => 'Emerald', 'price_monthly' => 27, 'target' => 'Creator', 'rank' => 2],
        'RUBY' => ['name' => 'Ruby', 'price_monthly' => 97, 'target' => 'Studio', 'rank' => 3],
    ],

    'stripe' => [
        'price_sapphire' => env('PLUS_STRIPE_PRICE_SAPPHIRE'),
        'price_emerald' => env('PLUS_STRIPE_PRICE_EMERALD'),
        'price_ruby' => env('PLUS_STRIPE_PRICE_RUBY'),
    ],

    /*
    | Ruby rebate: 1 free AirdropDistributor deploy per month, via an
    | off-chain rebate. The on-chain fee (0.0194 ETH flat) never
    | changes. Extra deploys are recorded at 50% off, off-chain only.
    */
    'ruby_free_deploys_per_month' => 1,
    'ruby_extra_deploy_discount_bps' => 5000,

    /*
    | Indexer: reorg-safe, processes only blocks at or below
    | latest - 12. One row per launch, keyed by certificate tokenId.
    */
    'indexer' => [
        'confirmations' => 12,
        'chunk_blocks' => 200,
        'max_chunks_per_run' => 25,
    ],
];
