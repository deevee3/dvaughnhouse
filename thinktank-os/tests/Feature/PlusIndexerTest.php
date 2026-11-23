<?php

namespace Tests\Feature;

use App\Models\PlusIndexerState;
use App\Models\TressLaunch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PlusIndexerTest extends TestCase
{
    use RefreshDatabase;

    private function fakeRpc(array $logs = []): void
    {
        Http::fake([
            '*sepolia.base.org*' => function ($request) use ($logs) {
                $payload = $request->data();
                $method = $payload['method'] ?? '';

                if ($method === 'eth_blockNumber') {
                    return Http::response(['jsonrpc' => '2.0', 'id' => 1, 'result' => '0x37836d0'], 200);
                }
                if ($method === 'eth_getLogs') {
                    return Http::response(['jsonrpc' => '2.0', 'id' => 1, 'result' => $logs], 200);
                }
                if ($method === 'eth_call') {
                    // recordOf: word 0 token, word 1 creator, rest zeros.
                    $record = str_pad('458cfd3df75af034c1218412e8f2489f9e9c9289', 64, '0', STR_PAD_LEFT);
                    $record .= str_pad('2c432c901d5844431b027dd652fbfd3cc3dd6094', 64, '0', STR_PAD_LEFT);
                    $record = str_pad($record, 19 * 64, '0');
                    return Http::response(['jsonrpc' => '2.0', 'id' => 1, 'result' => '0x'.$record], 200);
                }

                return Http::response(['jsonrpc' => '2.0', 'id' => 1, 'result' => null], 200);
            },
        ]);
    }

    public function test_indexer_runs_with_zero_launches_and_records_a_checkpoint(): void
    {
        $this->fakeRpc([]);

        $this->artisan('tress:index-launches')->assertExitCode(0);

        $this->assertSame(0, TressLaunch::count());
        $state = PlusIndexerState::for('launches');
        // 0x37836d0 = 58,210,000; safe-to is latest - 12. First run scans
        // from DEPLOY_BLOCK in 25 chunks of 200 blocks = 5,000 blocks.
        $this->assertSame(56205845 + 5000 - 1, $state->last_block);
        $this->assertSame(58210000, $state->latest_seen);
    }

    public function test_indexer_stores_one_launch_and_is_idempotent(): void
    {
        $log = [
            'topics' => [
                '0x632da754a73d699c5a33ebb173ea51f9876c433765e987d45a48599083c52f11',
                '0x'.str_pad('1', 64, '0', STR_PAD_LEFT),
                '0x'.str_pad('458cfd3df75af034c1218412e8f2489f9e9c9289', 64, '0', STR_PAD_LEFT),
                '0x'.str_pad('2c432c901d5844431b027dd652fbfd3cc3dd6094', 64, '0', STR_PAD_LEFT),
            ],
            'data' => '0x'.str_repeat('0', 64 * 11),
            'blockNumber' => '0x359a224', // 56,205,860, inside the first scan window
            'transactionHash' => '0x'.str_repeat('a', 64),
        ];
        $this->fakeRpc([$log]);

        $this->artisan('tress:index-launches')->assertExitCode(0);
        $this->assertSame(1, TressLaunch::count());
        $launch = TressLaunch::first();
        $this->assertSame(1, $launch->certificate_id);
        $this->assertSame('0x458cfd3df75af034c1218412e8f2489f9e9c9289', $launch->token_address);

        // Rewind the checkpoint and re-run: the same log is re-scanned
        // and upserted, not duplicated.
        PlusIndexerState::for('launches')->update(['last_block' => 0]);
        $this->artisan('tress:index-launches')->assertExitCode(0);
        $this->assertSame(1, TressLaunch::count());
    }
}
