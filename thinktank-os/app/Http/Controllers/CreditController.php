<?php

namespace App\Http\Controllers;

use App\Models\Attestation;
use App\Models\CreditAccount;
use App\Models\CreditTransaction;
use App\Models\User;
use App\Services\Credits\CreditService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CreditController extends Controller
{
    /**
     * Credits administration is restricted to orchestrators and admins.
     */
    private function authorizeCreditsAdmin(Request $request): User
    {
        $user = $request->user();

        if (! $user || ! $user->isOrchestrator()) {
            abort(403, 'Only Glenride orchestrators and admins can manage credit accounts.');
        }

        return $user;
    }

    /**
     * Accounts with balances, plus the most recent ledger activity.
     */
    public function index(Request $request): Response
    {
        $this->authorizeCreditsAdmin($request);

        $accounts = CreditAccount::with('owner:id,name')
            ->orderBy('name')
            ->get();

        $recentTransactions = CreditTransaction::with('account:id,name')
            ->latest('created_at')
            ->take(25)
            ->get();

        $users = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Credits/Index', [
            'accounts' => $accounts,
            'recentTransactions' => $recentTransactions,
            'users' => $users,
            'creditsPerUsd' => (float) config('credits.credits_per_usd', 75),
            'attestationPriceCredits' => (float) config('credits.attestation_price_credits', 75),
            'depositAddress' => config('credits.deposit_address'),
            'stanzaContract' => config('credits.stanza_contract'),
        ]);
    }

    /**
     * One account with its full ledger.
     */
    public function show(Request $request, CreditAccount $account): Response
    {
        $this->authorizeCreditsAdmin($request);

        $account->load('owner:id,name');

        $transactions = $account->transactions()
            ->with('creator:id,name')
            ->latest('created_at')
            ->get();

        return Inertia::render('Credits/Show', [
            'account' => $account,
            'transactions' => $transactions,
            'creditsPerUsd' => (float) config('credits.credits_per_usd', 75),
        ]);
    }

    /**
     * Create a study/project credit account.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizeCreditsAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'user_id' => 'nullable|uuid|exists:users,id',
            'wallet_address' => 'nullable|string|regex:/^0x[0-9a-fA-F]{40}$/',
        ]);

        CreditAccount::create([
            'name' => $validated['name'],
            'user_id' => $validated['user_id'] ?? null,
            'wallet_address' => $validated['wallet_address'] ?? null,
            'balance' => 0,
        ]);

        return back()->with('success', 'Credit account created.');
    }

    /**
     * Grant credits to an account (operator-funded budget).
     */
    public function grant(Request $request, CreditAccount $account, CreditService $credits): RedirectResponse
    {
        $user = $this->authorizeCreditsAdmin($request);

        $validated = $request->validate([
            'credits' => 'required|numeric|gt:0|max:100000000',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            $credits->grant($account, (float) $validated['credits'], $user, $validated['note'] ?? null);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }

        return back()->with('success', "Granted {$validated['credits']} TTOS to {$account->name}.");
    }

    /**
     * Record a STANZA deposit manually and allocate TTOS at the fixed rate.
     *
     * This is the prepaid-study path today: the study pays STANZA to the
     * deposit address, and an orchestrator records the confirmed deposit
     * here with the USD price used for conversion. The watcher job
     * automates the same recording from chain events.
     */
    public function deposit(Request $request, CreditAccount $account, CreditService $credits): RedirectResponse
    {
        $user = $this->authorizeCreditsAdmin($request);

        $validated = $request->validate([
            'blockchain_tx_hash' => 'required|string|regex:/^0x[0-9a-fA-F]{64}$/',
            'log_index' => 'nullable|integer|min:0',
            'token_amount' => 'required|numeric|gt:0',
            'token_price_usd' => 'required|numeric|gt:0',
        ]);

        $transaction = $credits->recordDeposit(
            $account,
            $validated['blockchain_tx_hash'],
            $validated['log_index'] ?? null,
            (float) $validated['token_amount'],
            (float) $validated['token_price_usd'],
            $user
        );

        return back()->with('success', "Deposit recorded: {$transaction->amount} TTOS allocated to {$account->name}.");
    }

    /**
     * Refund unused TTOS back to STANZA (owner policy, decided 2026-10-22).
     *
     * The STANZA quantity is priced at the lower of the account's original
     * (weighted-average deposit) price and the current market price, and a
     * refund tied to an attestation is eligible only after midnight
     * (America/New_York) following the attestation day. The payout itself
     * is a treasury Safe transfer made outside the app; the orchestrator
     * records it here with the payout tx hash when available.
     */
    public function refund(Request $request, CreditAccount $account, CreditService $credits): RedirectResponse
    {
        $user = $this->authorizeCreditsAdmin($request);

        $validated = $request->validate([
            'credits' => 'required|numeric|gt:0|max:100000000',
            'current_price_usd' => 'required|numeric|gt:0',
            'attestation_public_id' => 'nullable|string|exists:attestations,public_id',
            'payout_tx_hash' => 'nullable|string|regex:/^0x[0-9a-fA-F]{64}$/',
        ]);

        $attestation = ! empty($validated['attestation_public_id'])
            ? Attestation::where('public_id', $validated['attestation_public_id'])->first()
            : null;

        try {
            $transaction = $credits->refund(
                $account,
                (float) $validated['credits'],
                (float) $validated['current_price_usd'],
                $attestation,
                $validated['payout_tx_hash'] ?? null,
                $user
            );
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }

        return back()->with('success', "Refund recorded: {$validated['credits']} TTOS from {$account->name} converts to {$transaction->token_amount} STANZA at the policy price basis.");
    }
}
