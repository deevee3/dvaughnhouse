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
            throw new DomainException('Grant amount must be a positive number of credits.');
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
     * Record a STANZA deposit and allocate credits at the fixed peg.
     *
     * Credits Allocated = (STANZA Deposited × STANZA Price USD) / V_cr,
     * with V_cr = config('credits.peg_usd') ($0.01). The peg isolates the
     * ledger from token volatility after the deposit is converted.
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

        $peg = (float) config('credits.peg_usd', 0.01);
        $credits = round($tokenAmount * $priceUsd / $peg, 2);

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
     * (Cost_cr = C_op / V_cr; launch placeholder 100 credits = $1.00).
     * Throws DomainException when the prepaid balance cannot cover the
     * debit — the caller (attestation issuance) treats that as fatal.
     */
    public function debitForAttestation(CreditAccount $account, Attestation $attestation, User $by): CreditTransaction
    {
        $price = round((float) config('credits.attestation_price_credits', 100), 2);

        return DB::transaction(function () use ($account, $attestation, $by, $price) {
            $locked = CreditAccount::whereKey($account->id)->lockForUpdate()->firstOrFail();

            if ((float) $locked->balance < $price) {
                throw new DomainException(
                    "Insufficient credit balance: attestation costs {$price} credits but account \"{$locked->name}\" holds {$locked->balance}. Fund the study/project budget before attesting."
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
}
