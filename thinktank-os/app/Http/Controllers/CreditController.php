<?php

namespace App\Http\Controllers;

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
            'pegUsd' => (float) config('credits.peg_usd', 0.01),
            'attestationPriceCredits' => (float) config('credits.attestation_price_credits', 100),
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
            'pegUsd' => (float) config('credits.peg_usd', 0.01),
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

        return back()->with('success', "Granted {$validated['credits']} credits to {$account->name}.");
    }

    /**
     * Record a STANZA deposit manually and allocate credits at the peg.
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

        return back()->with('success', "Deposit recorded: {$transaction->amount} credits allocated to {$account->name}.");
    }
}
