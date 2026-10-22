<?php

return [

    /*
    |--------------------------------------------------------------------------
    | STANZA Credit Ledger (TTOS)
    |--------------------------------------------------------------------------
    |
    | The credit unit is TTOS (ThinkTank OS credits). Credits are
    | STANZA-backed service credits: users deposit STANZA (Base) and
    | receive off-chain TTOS in the relational ledger; services
    | (attestations first) consume them. The internal rate is FIXED so the
    | ledger is isolated from token price volatility:
    |
    |   75 TTOS = $1.00 USD   (V_cr = 1/75 USD per TTOS)
    |   TTOS Allocated = STANZA Deposited × STANZA Price USD × 75
    |   Service Cost (TTOS) = Operational Cost USD × 75
    |
    */

    // Fixed internal rate: 75 TTOS = $1.00 USD. V_cr (the USD value of one
    // TTOS) is therefore 1/75 USD.
    'credits_per_usd' => 75,

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
    | Service prices (in TTOS)
    |--------------------------------------------------------------------------
    |
    | Service Cost (TTOS) = C_op (USD) / V_cr = C_op × 75. One attestation
    | costs 75 TTOS = $1.00 of service (owner decision, 2026-10-22).
    |
    */

    'attestation_price_credits' => 75,

    // When true, issuing an attestation for a manuscript linked to a credit
    // account debits the account, and an insufficient balance aborts the
    // issuance. Manuscripts with no credit account are never debited.
    'enforce_balance' => (bool) env('CREDITS_ENFORCE_BALANCE', true),

];
