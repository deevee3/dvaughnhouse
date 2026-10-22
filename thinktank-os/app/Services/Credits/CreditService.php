<?php

namespace App\Services\Credits;

use App\Models\Attestation;
use App\Models\CreditAccount;
use App\Models\CreditTransaction;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class CreditService
{
    /**
     * Grant credits to an account (operator-funded budget top-up).
     *
     * Runs in a transaction with the account row locked so concurrent
     * grants/debits cannot interleave a stale balance.
     */
    public function grant(CreditAccount $account, float $credits, User $by, ?string $note = null): CreditTransaction
    {
        $credits = round($credits, 2);

        if ($credits <= 0) {
            throw new DomainException('Grant amount must be a positive number of TTOS.');
        }

        return DB::transaction(function () use ($account, $credits, $by, $note) {
            $locked = CreditAccount::whereKey($account->id)->lockForUpdate()->firstOrFail();

            $transaction = $locked->transactions()->create([
                'amount' => $credits,
                'type' => 'grant',
                'reference' => $note,
                'created_by' => $by->id,
            ]);

            $locked->update(['balance' => round((float) $locked->balance + $credits, 2)]);

            return $transaction;
        });
    }

    /**
     * Record a STANZA deposit and allocate TTOS at the fixed rate.
     *
     * TTOS Allocated = STANZA Deposited × STANZA Price USD × credits-per-USD,
     * with credits-per-USD = config('credits.credits_per_usd') (75 TTOS =
     * $1.00, so V_cr = 1/75 USD). The fixed rate isolates the ledger from
     * token volatility after the deposit is converted.
     *
     * Idempotent per (tx hash, log index): re-recording the same chain
     * event returns the existing transaction and changes nothing.
     */
    public function recordDeposit(CreditAccount $account, string $txHash, ?int $logIndex, float $tokenAmount, float $priceUsd, ?User $by = null): CreditTransaction
    {
        $existing = CreditTransaction::query()
            ->where('blockchain_tx_hash', $txHash)
            ->where('log_index', $logIndex)
            ->first();

        if ($existing) {
            return $existing;
        }

        $creditsPerUsd = (float) config('credits.credits_per_usd', 75);
        $credits = round($tokenAmount * $priceUsd * $creditsPerUsd, 2);

        return DB::transaction(function () use ($account, $txHash, $logIndex, $tokenAmount, $priceUsd, $credits, $by) {
            // Re-check inside the lock: a concurrent watcher pass may have
            // recorded this event between the first check and here.
            $duplicate = CreditTransaction::query()
                ->where('blockchain_tx_hash', $txHash)
                ->where('log_index', $logIndex)
                ->lockForUpdate()
                ->first();

            if ($duplicate) {
                return $duplicate;
            }

            $locked = CreditAccount::whereKey($account->id)->lockForUpdate()->firstOrFail();

            $transaction = $locked->transactions()->create([
                'amount' => $credits,
                'type' => 'deposit',
                'blockchain_tx_hash' => $txHash,
                'log_index' => $logIndex,
                'token_amount' => round($tokenAmount, 10),
                'token_price_usd' => round($priceUsd, 8),
                'reference' => 'STANZA deposit',
                'created_by' => $by?->id,
            ]);

            $locked->update(['balance' => round((float) $locked->balance + $credits, 2)]);

            return $transaction;
        });
    }

    /**
     * Debit an account for one attestation issuance.
     *
     * Service price comes from config('credits.attestation_price_credits')
     * (Cost_cr = C_op / V_cr; one attestation = 75 TTOS = $1.00 of service).
     * Throws DomainException when the prepaid balance cannot cover the
     * debit — the caller (attestation issuance) treats that as fatal.
     */
    public function debitForAttestation(CreditAccount $account, Attestation $attestation, User $by): CreditTransaction
    {
        $price = round((float) config('credits.attestation_price_credits', 75), 2);

        return DB::transaction(function () use ($account, $attestation, $by, $price) {
            $locked = CreditAccount::whereKey($account->id)->lockForUpdate()->firstOrFail();

            if ((float) $locked->balance < $price) {
                throw new DomainException(
                    "Insufficient TTOS balance: attestation costs {$price} TTOS but account \"{$locked->name}\" holds {$locked->balance}. Fund the study/project budget before attesting."
                );
            }

            $transaction = $locked->transactions()->create([
                'amount' => -$price,
                'type' => 'attestation',
                'reference' => $attestation->public_id,
                'created_by' => $by->id,
            ]);

            $locked->update(['balance' => round((float) $locked->balance - $price, 2)]);

            return $transaction;
        });
    }

    /**
     * Refund unused TTOS back to STANZA (owner policy, decided 2026-10-22;
     * penalty refinement added the same day).
     *
     * The STANZA quantity is computed at the LOWER of the original price
     * basis and the current market price, then capped at the original
     * quantity, then reduced by the restocking fee:
     *
     *   original = weighted-average token_price_usd across the account's
     *              priced deposit transactions (weighted by token_amount).
     *              Accounts with no priced deposits (grant-funded) use the
     *              current price as the original — no gain/loss adjustment.
     *   basis    = min(original, current)
     *   qty      = TTOS / credits_per_usd / basis
     *   cap      = qty never exceeds the original quantity attributable
     *              to the refunded TTOS: (TTOS / credits_per_usd) /
     *              original. Applies to deposit-funded accounts only;
     *              grant-funded accounts have no original quantity.
     *   STANZA out = capped qty × (1 − restocking fee)
     *
     * Net effect for deposit-funded accounts: a refund pays exactly
     * (1 − fee) of the original STANZA quantity attributable to the
     * refunded TTOS — 75% at the default 25% fee — regardless of price
     * movement. The fee exists to penalize refunds and encourage holding.
     *
     * Eligibility: when the refund is tied to an attestation, it becomes
     * eligible only after midnight (America/New_York) on the day of that
     * attestation — i.e. from 00:00 the following day, New York time.
     *
     * V1 execution: the STANZA payout itself is a treasury Safe transfer
     * performed outside the app; this method records the refund in the
     * ledger with the payout tx hash when one is supplied.
     */
    public function refund(CreditAccount $account, float $credits, float $currentPriceUsd, ?Attestation $attestation, ?string $payoutTxHash, User $by): CreditTransaction
    {
        $credits = round($credits, 2);

        if ($credits <= 0) {
            throw new DomainException('Refund amount must be a positive number of TTOS.');
        }

        if ((float) $account->balance < $credits) {
            throw new DomainException(
                "Insufficient TTOS balance: refund of {$credits} TTOS exceeds account \"{$account->name}\" balance of {$account->balance}."
            );
        }

        if ($currentPriceUsd <= 0) {
            throw new DomainException('A current STANZA price is required to refund — never refund at an unknown price.');
        }

        if ($attestation) {
            if (! $attestation->issued_at) {
                throw new DomainException("Attestation {$attestation->public_id} has no issuance timestamp, so refund eligibility cannot be determined.");
            }

            // Midnight at the START of the day after the attestation day,
            // in America/New_York. issued_at is stored in UTC.
            $eligibleFrom = $attestation->issued_at
                ->copy()
                ->setTimezone('America/New_York')
                ->startOfDay()
                ->addDay();

            if (now('America/New_York')->lessThan($eligibleFrom)) {
                throw new DomainException(
                    "Refund for attestation {$attestation->public_id} is not eligible until {$eligibleFrom->format('M j, Y g:i A T')} (midnight after the attestation day, New York time)."
                );
            }
        }

        $creditsPerUsd = (float) config('credits.credits_per_usd', 75);

        return DB::transaction(function () use ($account, $credits, $currentPriceUsd, $attestation, $payoutTxHash, $by, $creditsPerUsd) {
            $locked = CreditAccount::whereKey($account->id)->lockForUpdate()->firstOrFail();

            if ((float) $locked->balance < $credits) {
                throw new DomainException(
                    "Insufficient TTOS balance: refund of {$credits} TTOS exceeds account \"{$locked->name}\" balance of {$locked->balance}."
                );
            }

            $weightedAverage = $this->weightedAverageDepositPrice($locked);
            $original = $weightedAverage ?? $currentPriceUsd;
            $basis = min($original, $currentPriceUsd);

            if ($basis <= 0) {
                throw new DomainException('A current STANZA price is required to refund — never refund at an unknown price.');
            }

            // Quantity at the basis price.
            $qtyAtBasis = $credits / $creditsPerUsd / $basis;

            // Cap: never refund more STANZA than the original quantity
            // attributable to the refunded TTOS. Since basis =
            // min(original, current), $qtyAtBasis >= $origQty always, so
            // the cap binds exactly when the price fell. Grant-funded
            // accounts have no original quantity — no cap.
            $qtyCapped = $qtyAtBasis;

            if ($weightedAverage !== null && $weightedAverage > 0) {
                $origQty = ($credits / $creditsPerUsd) / $weightedAverage;
                $qtyCapped = min($qtyAtBasis, $origQty);
            }

            // Restocking fee (owner policy: penalize refunds, encourage
            // holding). Net effect for deposit-funded accounts: a refund
            // pays exactly (1 − fee) of the original STANZA quantity
            // attributable to the refunded TTOS, regardless of price
            // movement.
            $feePercent = (float) config('credits.restocking_fee_percent', 25);
            $stanzaOut = round($qtyCapped * (1 - $feePercent / 100), 10);

            $feeNote = 'refund ('.sprintf('%g', $feePercent).'% restocking fee applied)';
            $reference = $attestation ? $attestation->public_id.' · '.$feeNote : $feeNote;

            $transaction = $locked->transactions()->create([
                'amount' => -$credits,
                'type' => 'refund',
                'blockchain_tx_hash' => $payoutTxHash,
                'token_amount' => $stanzaOut,
                'token_price_usd' => round($basis, 8),
                'reference' => $reference,
                'created_by' => $by->id,
            ]);

            $locked->update(['balance' => round((float) $locked->balance - $credits, 2)]);

            return $transaction;
        });
    }

    /**
     * Weighted-average STANZA price (USD) across an account's priced
     * deposits, weighted by the STANZA amount of each deposit. Returns
     * null when the account has no priced deposits (e.g. grant-funded).
     */
    private function weightedAverageDepositPrice(CreditAccount $account): ?float
    {
        $deposits = $account->transactions()
            ->where('type', 'deposit')
            ->whereNotNull('token_price_usd')
            ->whereNotNull('token_amount')
            ->get(['token_amount', 'token_price_usd']);

        $totalTokens = 0.0;
        $totalValue = 0.0;

        foreach ($deposits as $deposit) {
            $tokens = (float) $deposit->token_amount;
            $totalTokens += $tokens;
            $totalValue += $tokens * (float) $deposit->token_price_usd;
        }

        if ($totalTokens <= 0) {
            return null;
        }

        return $totalValue / $totalTokens;
    }
}
