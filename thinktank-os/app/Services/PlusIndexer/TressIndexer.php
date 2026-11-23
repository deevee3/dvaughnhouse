<?php

namespace App\Services\PlusIndexer;

use App\Events\PlusFeedUpdated;
use App\Models\PlusIndexerState;
use App\Models\TressLaunch;
use Illuminate\Support\Facades\Log;

/**
 * Tress Column launch indexer.
 *
 * Watches the factory's Launched events and materialises per-launch
 * state into Postgres. Reorg-safe: only blocks at or below
 * latest - 12 are processed. Idempotent: one row per launch, keyed
 * by certificate tokenId; re-running a range re-reads the same rows.
 * Zero launches today means a run records a checkpoint and zero
 * rows, and says so.
 */
class TressIndexer
{
    public const LAUNCHED_TOPIC = '0x632da754a73d699c5a33ebb173ea51f9876c433765e987d45a48599083c52f11';

    public const HOOK_CERTIFICATE_FACTORY = '0x41422D19640660fb85739394b110C02622b397F9';

    public const LAUNCH_CERTIFICATE = '0xD32F1F5B18B6419CeeEe0eEDE2f74DbbF035dC84';

    public const DEPLOY_BLOCK = 56205845;

    private RpcClient $rpc;

    public function __construct(?RpcClient $rpc = null)
    {
        $this->rpc = $rpc ?? new RpcClient;
    }

    public function run(): array
    {
        $confirmations = (int) config('plus.indexer.confirmations', 12);
        $chunkBlocks = (int) config('plus.indexer.chunk_blocks', 200);
        $maxChunks = (int) config('plus.indexer.max_chunks_per_run', 25);

        $latest = $this->rpc->blockNumber();
        if ($latest === null) {
            return ['ok' => false, 'error' => 'Chain read failed. The indexer could not reach Base Sepolia.'];
        }

        $safeTo = $latest - $confirmations;
        $state = PlusIndexerState::for('launches');
        $state->update(['latest_seen' => $latest]);
        $from = max($state->last_block + 1, self::DEPLOY_BLOCK);

        if ($from > $safeTo) {
            $state->update(['last_run_at' => now()]);

            return ['ok' => true, 'indexed' => 0, 'from' => $from, 'to' => $safeTo, 'latest' => $latest, 'note' => 'Caught up. No new confirmed blocks to scan.'];
        }

        $indexed = 0;
        $scannedTo = $from - 1;
        $startFrom = $from;
        for ($chunk = 0; $chunk < $maxChunks && $from <= $safeTo; $chunk++) {
            $to = min($from + $chunkBlocks - 1, $safeTo);
            $logs = $this->rpc->getLogs([
                'address' => self::HOOK_CERTIFICATE_FACTORY,
                'topics' => [self::LAUNCHED_TOPIC],
                'fromBlock' => '0x'.dechex($from),
                'toBlock' => '0x'.dechex($to),
            ]);
            if ($logs === null) {
                return ['ok' => false, 'error' => 'Chain read failed while scanning blocks '.$from.' to '.$to.'. Checkpoint kept at '.$state->last_block.'.'];
            }
            foreach ($logs as $log) {
                if ($this->indexLog($log)) {
                    $indexed++;
                }
            }
            $scannedTo = $to;
            $from = $to + 1;
        }

        $state->update(['last_block' => $scannedTo, 'last_run_at' => now()]);

        if ($indexed > 0) {
            try {
                broadcast(new PlusFeedUpdated($indexed, $scannedTo));
            } catch (\Throwable $e) {
                Log::warning('Plus feed broadcast failed: '.$e->getMessage());
            }
        }

        return [
            'ok' => true,
            'indexed' => $indexed,
            'from' => $startFrom,
            'to' => $scannedTo,
            'latest' => $latest,
            'note' => $indexed === 0 ? 'No launches in the scanned range. The feed stays empty, honestly.' : $indexed.' launch(es) indexed.',
        ];
    }

    /** Index one Launched log. Returns true when a new launch row was stored. */
    public function indexLog(array $log): bool
    {
        $certificateId = RpcClient::hexToInt($log['topics'][1] ?? '0x0');
        if ($certificateId <= 0) {
            return false;
        }
        if (TressLaunch::where('certificate_id', $certificateId)->exists()) {
            return false;
        }

        $data = $log['data'] ?? '0x';
        $recordHex = $this->rpc->ethCall(
            self::LAUNCH_CERTIFICATE,
            '0x55d742e4'.RpcClient::encodeUintArg($certificateId)
        );

        $record = $recordHex ? $this->decodeCertificateRecord($recordHex) : null;

        TressLaunch::create([
            'certificate_id' => $certificateId,
            'token_address' => '0x'.strtolower(substr(RpcClient::strip0x($log['topics'][2] ?? ''), 24)),
            'creator_address' => '0x'.strtolower(substr(RpcClient::strip0x($log['topics'][3] ?? ''), 24)),
            'locker_address' => RpcClient::wordAddress($data, 0),
            'vesting_vault_address' => RpcClient::wordAddress($data, 1),
            'airdrop_distributor_address' => RpcClient::wordAddress($data, 2),
            'hook_core_address' => RpcClient::wordAddress($data, 3),
            'hook_address' => RpcClient::wordAddress($data, 4),
            'quote_asset_address' => RpcClient::wordAddress($data, 5),
            'total_supply' => RpcClient::hexToDecimal(RpcClient::wordAt($data, 6)),
            'volume_threshold_quote' => RpcClient::hexToDecimal(RpcClient::wordAt($data, 7)),
            'pool_fee_tier' => RpcClient::hexToInt(RpcClient::wordAt($data, 8)),
            'lock_mode' => $record['lock_mode'] ?? 0,
            'unlock_time' => $record['unlock_time'] ?? '0',
            'vesting_bps' => $record['vesting_bps'] ?? 0,
            'airdrop_bps' => $record['airdrop_bps'] ?? 0,
            'liquidity_bps' => $record['liquidity_bps'] ?? 0,
            'launch_block' => RpcClient::hexToInt($log['blockNumber'] ?? '0x0'),
            'transaction_hash' => $log['transactionHash'] ?? null,
        ]);

        return true;
    }

    /** CertificateRecord, 19 words, same order as the JS decoder. */
    public function decodeCertificateRecord(string $hex): array
    {
        $u = fn (int $i) => RpcClient::hexToInt(RpcClient::wordAt($hex, $i));
        $d = fn (int $i) => RpcClient::hexToDecimal(RpcClient::wordAt($hex, $i));

        return [
            'token' => RpcClient::wordAddress($hex, 0),
            'creator' => RpcClient::wordAddress($hex, 1),
            'quote_asset' => RpcClient::wordAddress($hex, 2),
            'total_supply' => $d(3),
            'pool_fee_tier' => $u(4),
            'volume_threshold_quote' => $d(5),
            'usd_gate' => $d(6),
            'lock_mode' => $u(7),
            'unlock_time' => $d(8),
            'lp_fee_mode' => $u(9),
            'vesting_bps' => $u(10),
            'airdrop_bps' => $u(11),
            'liquidity_bps' => $u(12),
            'locker' => RpcClient::wordAddress($hex, 13),
            'vesting_vault' => RpcClient::wordAddress($hex, 14),
            'airdrop_distributor' => RpcClient::wordAddress($hex, 15),
            'hook_core' => RpcClient::wordAddress($hex, 16),
            'launch_block' => $u(17),
            'chain_id' => $u(18),
        ];
    }
}
