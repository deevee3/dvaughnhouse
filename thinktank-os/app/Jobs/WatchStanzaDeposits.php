<?php

namespace App\Jobs;

use App\Models\CreditAccount;
use App\Services\Credits\CreditService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WatchStanzaDeposits implements ShouldQueue
{
    use Queueable;

    /**
     * ERC-20 Transfer(address,address,uint256) event topic.
     */
    private const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    /**
     * Cache key holding the last fully processed Base block number.
     * The default cache store is the database store, so the cursor
     * survives deploys and queue worker restarts.
     */
    private const BLOCK_CACHE_KEY = 'credits.watcher.last_block';

    /**
     * Confirmations kept behind the chain head (reorg safety buffer).
     */
    private const REORG_BUFFER = 12;

    /**
     * Max blocks per eth_getLogs call.
     */
    private const BLOCK_CHUNK = 2000;

    /**
     * Run one deposit-watch pass.
     *
     * Scans STANZA Transfer events TO the configured deposit address,
     * matches each sender to a credit account by wallet_address, and
     * credits the account through CreditService::recordDeposit (which is
     * idempotent per tx hash + log index, so re-scanning a block range
     * never double-credits). Defensive by design: any RPC failure is
     * logged and the pass returns; the block cursor only advances past
     * ranges that were fully processed.
     */
    public function handle(CreditService $credits): void
    {
        if (! config('credits.watcher_enabled')) {
            Log::info('STANZA deposit watcher: disabled (credits.watcher_enabled=false), skipping pass.');

            return;
        }

        $price = config('credits.stanza_price_usd');

        if ($price === null) {
            // Never invent a price. Defer the whole pass (cursor untouched)
            // so deposits are credited once a price is configured.
            Log::warning('STANZA deposit watcher: credits.stanza_price_usd is not configured; skipping crediting this pass.');

            return;
        }

        try {
            $this->runPass($credits, (float) $price);
        } catch (\Throwable $e) {
            Log::error('STANZA deposit watcher: pass failed: '.$e->getMessage());
        }
    }

    private function runPass(CreditService $credits, float $price): void
    {
        $rpcUrl = (string) config('credits.base_rpc_url');
        $contract = strtolower((string) config('credits.stanza_contract'));
        $depositAddress = strtolower((string) config('credits.deposit_address'));
        $depositTopic = '0x'.str_pad(substr($depositAddress, 2), 64, '0', STR_PAD_LEFT);

        $head = $this->rpc($rpcUrl, 'eth_blockNumber', []);
        $latest = (int) hexdec((string) $head);

        $safeHead = $latest - self::REORG_BUFFER;
        $from = (int) Cache::get(self::BLOCK_CACHE_KEY, 0);

        if ($from <= 0) {
            // First ever run: start at the safe head instead of replaying
            // the token's entire history into the ledger.
            Cache::forever(self::BLOCK_CACHE_KEY, max($safeHead, 0));
            Log::info("STANZA deposit watcher: cursor initialized at block {$safeHead}.");

            return;
        }

        if ($safeHead <= $from) {
            return;
        }

        $cursor = $from;

        while ($cursor < $safeHead) {
            $chunkEnd = min($cursor + self::BLOCK_CHUNK - 1, $safeHead);

            $logs = $this->rpc($rpcUrl, 'eth_getLogs', [[
                'fromBlock' => '0x'.dechex($cursor + 1),
                'toBlock' => '0x'.dechex($chunkEnd),
                'address' => $contract,
                'topics' => [self::TRANSFER_TOPIC, null, $depositTopic],
            ]]);

            foreach (is_array($logs) ? $logs : [] as $log) {
                $this->processLog($credits, $log, $price);
            }

            $cursor = $chunkEnd;
            Cache::forever(self::BLOCK_CACHE_KEY, $cursor);
        }
    }

    /**
     * Credit one deposit log, when its sender maps to a credit account.
     */
    private function processLog(CreditService $credits, array $log, float $price): void
    {
        $topics = $log['topics'] ?? [];

        if (count($topics) < 3 || empty($log['transactionHash']) || ! isset($log['data'])) {
            return;
        }

        $sender = '0x'.substr((string) $topics[1], -40);

        $account = CreditAccount::query()
            ->whereRaw('lower(wallet_address) = ?', [strtolower($sender)])
            ->first();

        if (! $account) {
            Log::info("STANZA deposit watcher: deposit from unmapped wallet {$sender} (tx {$log['transactionHash']}) — no credit account, skipped.");

            return;
        }

        // uint256 amount, 18 decimals. hexdec returns a float for values
        // beyond PHP int range; at STANZA scale the rounding is far below
        // the ledger's 10-decimal token precision.
        $amount = (float) hexdec((string) $log['data']) / 1e18;
        $logIndex = isset($log['logIndex']) ? (int) hexdec((string) $log['logIndex']) : null;

        $credits->recordDeposit($account, (string) $log['transactionHash'], $logIndex, $amount, $price, null);
    }

    /**
     * Minimal JSON-RPC call over the Http facade. Throws on transport or
     * RPC-level errors; the caller logs and abandons the pass.
     */
    private function rpc(string $rpcUrl, string $method, array $params): mixed
    {
        $response = Http::timeout(20)->post($rpcUrl, [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => $method,
            'params' => $params,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException("RPC {$method} HTTP {$response->status()}");
        }

        $json = $response->json();

        if (isset($json['error'])) {
            throw new \RuntimeException("RPC {$method} error: ".json_encode($json['error']));
        }

        return $json['result'] ?? null;
    }
}
