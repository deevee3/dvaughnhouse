<?php

namespace App\Http\Controllers;

use App\Models\PlusAirdropRebate;
use App\Models\PlusAlert;
use App\Models\PlusIndexerState;
use App\Models\PlusSnapshot;
use App\Models\PlusSubscription;
use App\Models\PlusSupportRequest;
use App\Models\TressLaunch;
use App\Services\PlusBilling\BillingNotConfiguredException;
use App\Services\PlusBilling\PlusBilling;
use App\Services\PlusIndexer\RpcClient;
use App\Services\PlusIndexer\SnapshotService;
use App\Services\PlusIndexer\TressIndexer;
use App\Support\Plus\MerkleTree;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Tress Column Plus+ API. All routes are signed-in only.
 *
 * Entitlement: Sapphire opens the feed, radar, and whale tracking.
 * Emerald opens the workbench, snapshot builder, Scout, and
 * Watchtower. Ruby opens rebates, Citadel, exports, and support.
 * A pass buys tools, sight, and time. Nothing here touches a
 * contract, a lock, a fee, or anyone else's launch. Subscription
 * state is SaaS state; launch figures are on-chain state, labelled.
 */
class PlusApiController extends Controller
{
    private function currentSubscription(Request $request): ?PlusSubscription
    {
        return PlusSubscription::activeFor($request->user());
    }

    private function requireTier(Request $request, string $tier): ?JsonResponse
    {
        $sub = $this->currentSubscription($request);
        if (! $sub || ! $sub->grants($tier)) {
            return response()->json([
                'ok' => false,
                'error' => 'This needs a Plus+ pass at '.$tier.' or higher. Your account has no active pass at that tier.',
                'tier_required' => $tier,
            ], 403);
        }

        return null;
    }

    private function subscriptionPayload(?PlusSubscription $sub): ?array
    {
        if (! $sub) {
            return null;
        }

        return [
            'tier' => $sub->tier,
            'status' => $sub->status,
            'provider' => $sub->provider,
            'provider_mode' => $sub->provider_mode,
            'started_at' => $sub->started_at?->toIso8601String(),
            'renews_at' => $sub->renews_at?->toIso8601String(),
            'price_monthly' => config('plus.tiers.'.$sub->tier.'.price_monthly'),
        ];
    }

    public function subscription(Request $request): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'subscription' => $this->subscriptionPayload($this->currentSubscription($request)),
            'billing' => PlusBilling::state(),
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = Validator::make($request->all(), [
            'tier' => ['required', 'string', 'in:SAPPHIRE,EMERALD,RUBY'],
        ])->validate();

        try {
            $sub = PlusBilling::subscribe($request->user(), $data['tier']);
        } catch (BillingNotConfiguredException $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 409);
        }

        return response()->json([
            'ok' => true,
            'subscription' => $this->subscriptionPayload($sub),
            'note' => $sub->provider_mode === 'test'
                ? 'Test mode. No charge was made and no live payment provider was called.'
                : 'Subscription recorded.',
        ]);
    }

    public function cancelSubscription(Request $request): JsonResponse
    {
        $sub = $this->currentSubscription($request);
        if (! $sub) {
            return response()->json(['ok' => false, 'error' => 'No active subscription on record for this account.'], 404);
        }

        try {
            PlusBilling::cancel($sub);
        } catch (BillingNotConfiguredException $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 409);
        }

        return response()->json(['ok' => true, 'subscription' => null]);
    }

    public function indexerStatus(): JsonResponse
    {
        $state = PlusIndexerState::for('launches');

        return response()->json([
            'ok' => true,
            'launch_count' => TressLaunch::count(),
            'last_block' => $state->last_block,
            'latest_seen' => $state->latest_seen,
            'last_run_at' => $state->last_run_at?->toIso8601String(),
            'confirmations' => (int) config('plus.indexer.confirmations', 12),
            'deploy_block' => TressIndexer::DEPLOY_BLOCK,
        ]);
    }

    public function feed(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'SAPPHIRE')) {
            return $denied;
        }

        $query = TressLaunch::orderByDesc('launch_block');
        if ($request->boolean('pure')) {
            $query->where('lock_mode', 0)->where('vesting_bps', 0);
        }
        $launches = $query->limit(50)->get();

        return response()->json([
            'ok' => true,
            'source' => 'on-chain',
            'launches' => $launches->map(fn (TressLaunch $launch) => [
                'certificate_id' => $launch->certificate_id,
                'token' => $launch->token_address,
                'creator' => $launch->creator_address,
                'lock_mode' => $launch->lock_mode,
                'unlock_time' => $launch->unlock_time,
                'vesting_bps' => $launch->vesting_bps,
                'pool_fee_tier' => $launch->pool_fee_tier,
                'launch_block' => $launch->launch_block,
                'pure' => $launch->isPure(),
            ]),
            'note' => $launches->isEmpty() ? 'No launches exist yet. The feed is empty until the first launch is indexed.' : null,
        ]);
    }

    /** Live feed over server-sent events. The portal reconnects on close. */
    public function feedStream(Request $request)
    {
        if ($denied = $this->requireTier($request, 'SAPPHIRE')) {
            return $denied;
        }

        return response()->stream(function () {
            $state = PlusIndexerState::for('launches');
            $payload = json_encode([
                'launch_count' => TressLaunch::count(),
                'last_block' => $state->last_block,
                'latest_seen' => $state->latest_seen,
                'last_run_at' => $state->last_run_at?->toIso8601String(),
            ]);
            echo 'event: snapshot'."\n".'data: '.$payload."\n\n";
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
            for ($i = 0; $i < 2; $i++) {
                sleep(10);
                echo 'event: heartbeat'."\n".'data: {"ok":true}'."\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function radar(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'SAPPHIRE')) {
            return $denied;
        }

        $distributors = TressLaunch::whereNotNull('airdrop_distributor_address')
            ->orderByDesc('launch_block')
            ->get(['certificate_id', 'token_address', 'airdrop_distributor_address', 'launch_block']);

        return response()->json([
            'ok' => true,
            'source' => 'on-chain',
            'campaigns' => $distributors->map(fn (TressLaunch $launch) => [
                'certificate_id' => $launch->certificate_id,
                'token' => $launch->token_address,
                'distributor' => $launch->airdrop_distributor_address,
                'launch_block' => $launch->launch_block,
            ]),
            'note' => $distributors->isEmpty()
                ? 'No airdrop campaigns exist. The radar has nothing to watch until the first launch with a distributor is indexed.'
                : 'Claim checks need the campaign holder list. No campaign lists are published yet, so the radar lists distributors without inventing allocations.',
            'batch_claimer' => 'The batch claimer needs the multicall wrapper contract, a separate build. It is not built here, and the portal does not pretend it is.',
        ]);
    }

    public function verifyClaim(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'SAPPHIRE')) {
            return $denied;
        }

        $data = Validator::make($request->all(), [
            'distributor' => ['required', 'string', 'regex:/^0x[0-9a-fA-F]{40}$/'],
            'index' => ['required', 'integer', 'min:0'],
            'account' => ['required', 'string', 'regex:/^0x[0-9a-fA-F]{40}$/'],
            'amount' => ['required', 'string', 'regex:/^[0-9]+$/'],
            'proof' => ['required', 'array'],
            'proof.*' => ['string', 'regex:/^0x[0-9a-fA-F]{64}$/'],
        ])->validate();

        $rpc = new RpcClient;
        $rootHex = $rpc->ethCall($data['distributor'], '0x2eb4a7ab');
        if ($rootHex === null) {
            return response()->json(['ok' => false, 'error' => 'Chain read failed. The distributor root could not be read.'], 502);
        }
        $root = '0x'.strtolower(substr(\App\Services\PlusIndexer\RpcClient::strip0x($rootHex), 0, 64));

        $leaf = MerkleTree::leafFor((int) $data['index'], $data['account'], $data['amount']);
        $valid = MerkleTree::verify($leaf, $data['proof'], $root);

        return response()->json([
            'ok' => true,
            'valid' => $valid,
            'root' => $root,
            'leaf' => $leaf,
            'note' => $valid
                ? 'Proof checks against the on-chain root. Claiming still happens on chain, in your own wallet.'
                : 'Proof does not match the on-chain root. Check the index, account, amount, and proof.',
        ]);
    }

    public function whales(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'SAPPHIRE')) {
            return $denied;
        }

        $data = Validator::make($request->all(), [
            'token' => ['required', 'string', 'regex:/^0x[0-9a-fA-F]{40}$/'],
        ])->validate();

        $service = new SnapshotService;
        $latest = (new RpcClient)->blockNumber();
        $block = $latest ? $latest - (int) config('plus.indexer.confirmations', 12) : 0;
        $result = $service->computeHolders($data['token'], $block);
        if (isset($result['error'])) {
            return response()->json(['ok' => false, 'error' => $result['error']], 502);
        }

        $holders = collect($result['holders'])
            ->sortByDesc(fn ($holder) => $holder['balance'])
            ->values()
            ->take(10);

        return response()->json([
            'ok' => true,
            'source' => 'on-chain',
            'token' => $data['token'],
            'snapshot_block' => $block,
            'scanned_from' => $result['scanned_from'],
            'scanned_to' => $result['scanned_to'],
            'top_holders' => $holders,
            'note' => 'Top holders from Transfer events in the scanned window only. No price, no market value, no alerts outside this window.',
        ]);
    }

    public function listSnapshots(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }

        return response()->json([
            'ok' => true,
            'snapshots' => PlusSnapshot::where('user_id', $request->user()->id)
                ->orderByDesc('id')->get(),
        ]);
    }

    public function createSnapshot(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }

        $data = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:128'],
            'token_address' => ['required', 'string', 'regex:/^0x[0-9a-fA-F]{40}$/'],
            'snapshot_block' => ['required', 'integer', 'min:0'],
            'filters' => ['nullable', 'array'],
            'filters.min_hold_blocks' => ['nullable', 'integer', 'min:0'],
            'filters.exclude_first_n_blocks' => ['nullable', 'integer', 'min:0'],
        ])->validate();

        $snapshot = PlusSnapshot::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'token_address' => strtolower($data['token_address']),
            'snapshot_block' => $data['snapshot_block'],
            'filters' => $data['filters'] ?? [],
            'status' => 'draft',
        ]);

        return response()->json(['ok' => true, 'snapshot' => $snapshot], 201);
    }

    public function computeSnapshot(Request $request, PlusSnapshot $snapshot): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }
        if ($snapshot->user_id !== $request->user()->id) {
            return response()->json(['ok' => false, 'error' => 'Snapshot not found.'], 404);
        }

        $service = new SnapshotService;
        $result = $service->computeHolders($snapshot->token_address, $snapshot->snapshot_block, $snapshot->filters ?? []);
        if (isset($result['error'])) {
            return response()->json(['ok' => false, 'error' => $result['error']], 502);
        }

        $snapshot->update([
            'status' => 'computed',
            'holder_count' => count($result['holders']),
            'holders' => $result['holders'],
            'excluded' => $result['excluded'],
        ]);

        return response()->json([
            'ok' => true,
            'snapshot' => $snapshot->fresh(),
            'scanned_from' => $result['scanned_from'],
            'scanned_to' => $result['scanned_to'],
            'complete' => $result['complete'],
            'note' => 'Exclusions are listed by name below. Nothing was silently excluded.',
        ]);
    }

    public function generateSnapshotRoot(Request $request, PlusSnapshot $snapshot): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }
        if ($snapshot->user_id !== $request->user()->id) {
            return response()->json(['ok' => false, 'error' => 'Snapshot not found.'], 404);
        }
        if ($snapshot->status !== 'computed' || empty($snapshot->holders)) {
            return response()->json(['ok' => false, 'error' => 'Compute holders first. A root needs a computed holder list.'], 409);
        }

        $service = new SnapshotService;
        $built = $service->buildRoot($snapshot->holders);
        $snapshot->update(['status' => 'ready', 'merkle_root' => $built['root']]);

        return response()->json([
            'ok' => true,
            'snapshot' => $snapshot->fresh(),
            'note' => 'Root uses the AirdropDistributor leaf rule: keccak256(index, account, amount), sorted pairs. Verify it against the distributor before publishing.',
        ]);
    }

    public function snapshotProof(Request $request, PlusSnapshot $snapshot): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }
        if ($snapshot->user_id !== $request->user()->id) {
            return response()->json(['ok' => false, 'error' => 'Snapshot not found.'], 404);
        }

        $account = strtolower((string) $request->query('account', ''));
        $holders = $snapshot->holders ?? [];
        $index = collect($holders)->search(fn ($holder) => strtolower($holder['address']) === $account);
        if ($index === false) {
            return response()->json(['ok' => false, 'error' => 'Account is not in this snapshot.'], 404);
        }

        $service = new SnapshotService;
        $built = $service->buildRoot($holders);

        return response()->json([
            'ok' => true,
            'index' => $index,
            'account' => $holders[$index]['address'],
            'amount' => $holders[$index]['balance'],
            'proof' => $built['tree']->proof($index),
            'root' => $built['root'],
        ]);
    }

    public function exportSnapshot(Request $request, PlusSnapshot $snapshot)
    {
        if ($denied = $this->requireTier($request, 'RUBY')) {
            return $denied;
        }
        if ($snapshot->user_id !== $request->user()->id) {
            return response()->json(['ok' => false, 'error' => 'Snapshot not found.'], 404);
        }

        $rows = [['index', 'address', 'balance_wei']];
        foreach ($snapshot->holders ?? [] as $index => $holder) {
            $rows[] = [$index, $holder['address'], $holder['balance']];
        }

        $csv = collect($rows)->map(fn ($row) => implode(',', $row))->implode("\n");

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="snapshot-'.$snapshot->id.'.csv"',
        ]);
    }

    public function listAlerts(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }

        return response()->json([
            'ok' => true,
            'alerts' => PlusAlert::where('user_id', $request->user()->id)->orderByDesc('id')->get(),
            'note' => 'Alerts show in the portal only. No email or push channel is wired on this build.',
        ]);
    }

    public function createAlert(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }

        $data = Validator::make($request->all(), [
            'type' => ['required', 'string', 'in:whale,release,gate'],
            'target' => ['required', 'string', 'max:128'],
            'threshold_bps' => ['nullable', 'string', 'max:16'],
        ])->validate();

        $alert = PlusAlert::create([
            'user_id' => $request->user()->id,
            'type' => $data['type'],
            'target' => $data['target'],
            'threshold_bps' => $data['threshold_bps'] ?? null,
            'enabled' => true,
        ]);

        return response()->json(['ok' => true, 'alert' => $alert], 201);
    }

    public function toggleAlert(Request $request, PlusAlert $alert): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }
        if ($alert->user_id !== $request->user()->id) {
            return response()->json(['ok' => false, 'error' => 'Alert not found.'], 404);
        }

        $alert->update(['enabled' => ! $alert->enabled]);

        return response()->json(['ok' => true, 'alert' => $alert->fresh()]);
    }

    public function deleteAlert(Request $request, PlusAlert $alert): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'EMERALD')) {
            return $denied;
        }
        if ($alert->user_id !== $request->user()->id) {
            return response()->json(['ok' => false, 'error' => 'Alert not found.'], 404);
        }

        $alert->delete();

        return response()->json(['ok' => true]);
    }

    public function listRebates(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'RUBY')) {
            return $denied;
        }

        $user = $request->user();
        $usedThisMonth = PlusAirdropRebate::where('user_id', $user->id)
            ->where('rebate_status', 'free')
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
        $freeLeft = max(0, (int) config('plus.ruby_free_deploys_per_month', 1) - $usedThisMonth);

        return response()->json([
            'ok' => true,
            'free_deploys_left_this_month' => $freeLeft,
            'rebates' => PlusAirdropRebate::where('user_id', $user->id)->orderByDesc('id')->get(),
            'note' => 'Rebates are off-chain records. The on-chain fee (0.0194 ETH flat) never changes. Extra deploys are recorded at 50% off, off-chain only.',
        ]);
    }

    public function claimRebate(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'RUBY')) {
            return $denied;
        }

        $data = Validator::make($request->all(), [
            'campaign' => ['required', 'string', 'max:128'],
            'fee_wei' => ['required', 'string', 'regex:/^[0-9]+$/'],
        ])->validate();

        $user = $request->user();
        $usedThisMonth = PlusAirdropRebate::where('user_id', $user->id)
            ->where('rebate_status', 'free')
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
        $status = $usedThisMonth < (int) config('plus.ruby_free_deploys_per_month', 1) ? 'free' : 'half_price';

        $rebate = PlusAirdropRebate::create([
            'user_id' => $user->id,
            'campaign' => $data['campaign'],
            'fee_wei' => $data['fee_wei'],
            'rebate_status' => $status,
            'used_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'rebate' => $rebate,
            'note' => $status === 'free'
                ? 'This deploy is covered by the Ruby monthly rebate, off-chain. The on-chain fee still applies at deploy time; the rebate is recorded here.'
                : 'Monthly free deploy already used. This deploy is recorded at 50% off, off-chain only.',
        ], 201);
    }

    public function listSupport(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'RUBY')) {
            return $denied;
        }

        return response()->json([
            'ok' => true,
            'requests' => PlusSupportRequest::where('user_id', $request->user()->id)->orderByDesc('id')->get(),
        ]);
    }

    public function createSupport(Request $request): JsonResponse
    {
        if ($denied = $this->requireTier($request, 'RUBY')) {
            return $denied;
        }

        $data = Validator::make($request->all(), [
            'subject' => ['required', 'string', 'max:160'],
            'body' => ['required', 'string', 'max:4000'],
        ])->validate();

        $support = PlusSupportRequest::create([
            'user_id' => $request->user()->id,
            'subject' => $data['subject'],
            'body' => $data['body'],
            'status' => 'open',
        ]);

        return response()->json(['ok' => true, 'request' => $support], 201);
    }
}
