<?php

return [

    /*
    |--------------------------------------------------------------------------
    | STANZA Credit Ledger
    |--------------------------------------------------------------------------
    |
    | Credits are STANZA-backed service credits. Users deposit STANZA (Base)
    | and receive off-chain credits in the relational ledger; services
    | (attestations first) consume them. The internal peg is FIXED so the
    | ledger is isolated from token price volatility:
    |
    |   1 Credit = $0.01 USD
    |   Credits Allocated = (STANZA Deposited × STANZA Price USD) / peg
    |   Service Cost (credits) = Operational Cost USD / peg
    |
    */

    // Fixed internal value of one credit, in USD.
    'peg_usd' => 0.01,

    // STANZA token contract on Base (paired with wTAO; USD price is dynamic).
    'stanza_contract' => '0xf629f16ba91086e266accc417d10742f76207ba3',

    // Address deposits are sent to. Defaults to the STANZA treasury Safe.
    'deposit_address' => env('CREDITS_DEPOSIT_ADDRESS', '0x0f166D7631350dE1F9c4190dEA4fAE9565B19231'),

    // JSON-RPC endpoint for the deposit watcher.
    'base_rpc_url' => env('CREDITS_BASE_RPC_URL', 'https://mainnet.base.org'),

    // USD price of one STANZA used by the watcher when crediting deposits.
    // Null until the STANZA pool has real liquidity — the watcher never
    // invents a price; with a null price it skips crediting and logs.
    // Manual deposit recording takes an explicit price at entry time.
    'stanza_price_usd' => env('CREDITS_STANZA_PRICE_USD') !== null
        ? (float) env('CREDITS_STANZA_PRICE_USD')
        : null,

    // Whether the deposit watcher job processes on-chain deposit events.
    'watcher_enabled' => (bool) env('CREDITS_WATCHER_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Service prices (in credits)
    |--------------------------------------------------------------------------
    |
    | Service Cost (credits) = C_op (USD) / peg. The attestation price is a
    | launch placeholder: 100 credits = $1.00 at the peg. Owner-adjustable.
    |
    */

    'attestation_price_credits' => 100,

    // When true, issuing an attestation for a manuscript linked to a credit
    // account debits the account, and an insufficient balance aborts the
    // issuance. Manuscripts with no credit account are never debited.
    'enforce_balance' => (bool) env('CREDITS_ENFORCE_BALANCE', true),

];
