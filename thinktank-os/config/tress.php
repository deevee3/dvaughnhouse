<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tress Column chain reads
    |--------------------------------------------------------------------------
    |
    | The browser never talks to the chain directly. Reads go through the
    | read-only relay (TressRpcController), which forwards to this URL.
    | Base Sepolia only. There is no mainnet path anywhere in this app.
    */
    'rpc_url' => env('TRESS_RPC_URL', 'https://sepolia.base.org'),

    /*
    |--------------------------------------------------------------------------
    | Staff allowlist (ops console)
    |--------------------------------------------------------------------------
    |
    | Decided Nov 17, 2026: D'Vaughn only. Comma-separated emails.
    | Checked by the ops controller at request time. The same list gates
    | nothing else; tc and trade stay open to any signed-in reader.
    */
    'staff_emails' => array_values(array_filter(array_map(
        fn ($e) => strtolower(trim($e)),
        explode(',', (string) env('TRESS_STAFF_EMAILS', 'dvaughn@dvaughnhouse.com'))
    ))),

    /*
    |--------------------------------------------------------------------------
    | Session spec (50 minutes, decided Nov 17, 2026)
    |--------------------------------------------------------------------------
    |
    | SPEC, reviewed before ship (PRD Q6):
    | - Lifetime is a sliding inactivity window of 50 minutes. Any
    |   authenticated request refreshes the window. 50 minutes with no
    |   request ends the session and the next visit shows signed-out
    |   content. This is Laravel's session lifetime semantics with
    |   SESSION_LIFETIME=50 in the host environment.
    | - No "remember me" extension exists on these surfaces. Signing out
    |   ends the session immediately and never cancels a pending
    |   on-chain transaction. Results resurface on return by address
    |   scan when the wallet reconnects (see wallet.js).
    | - One sign-in covers all four surfaces (Nov 20, 2026, his word:
    |   the surfaces "just loop around" on host-only cookies). The
    |   TressSessionDomain middleware shares the session cookie across
    |   *.dvaughnhouse.com (SESSION_SHARED_DOMAIN); staging keeps
    |   host-only cookies. Per-surface logged-in states stay distinct
    |   — sharing the session does not merge what each surface shows.
    | - The lifetime value itself lives in the host .env
    |   (SESSION_LIFETIME), not in this file, because it is an
    |   environment setting. Do not change config/session.php defaults
    |   here: the value applies to the whole ThinkTank app.
    */
];
