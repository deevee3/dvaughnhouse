<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Read-only JSON-RPC relay to Base Sepolia.
 *
 * The browser never talks to the chain directly: reads go through this
 * endpoint so the app works under any content policy and the RPC URL
 * stays server-side. Only read methods are forwarded. No write method
 * (send, sign, personal) is ever forwarded, whatever the caller asks.
 *
 * eth_getLogs is paged internally: the public RPC caps one call at a
 * 200-block range, so the relay walks the requested range in chunks of
 * 200 blocks, at most 25 chunks per request. When more range remains,
 * the response carries tress.nextFromBlock and the caller pages on.
 */
class TressRpcController extends Controller
{
    private const ALLOWED_METHODS = [
        'eth_chainId',
        'eth_blockNumber',
        'eth_call',
        'eth_getBalance',
        'eth_getCode',
        'eth_getTransactionReceipt',
        'eth_getTransactionByHash',
        'eth_getTransactionCount',
        'eth_gasPrice',
        'eth_estimateGas',
        'eth_getLogs',
        'eth_getBlockByNumber',
    ];

    private const LOG_CHUNK_BLOCKS = 200;

    private const LOG_MAX_CHUNKS = 25;

    public function relay(Request $request): JsonResponse
    {
        $body = $request->json()->all();
        $method = $body['method'] ?? null;
        $id = $body['id'] ?? 1;
        $params = $body['params'] ?? [];

        if (! is_string($method) || ! in_array($method, self::ALLOWED_METHODS, true)) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32601, 'message' => 'Method not allowed. This relay forwards reads only.'],
            ], 403);
        }

        if (! is_array($params)) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32602, 'message' => 'Params must be an array.'],
            ], 422);
        }

        if ($method === 'eth_getLogs') {
            return $this->relayLogs($id, $params);
        }

        $upstream = $this->forward($method, $params, $id);

        if ($upstream === null) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32000, 'message' => 'The chain read failed.'],
            ], 502);
        }

        return response()->json($upstream);
    }

    private function relayLogs(mixed $id, array $params): JsonResponse
    {
        $filter = $params[0] ?? [];
        if (! is_array($filter)) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32602, 'message' => 'eth_getLogs needs a filter object.'],
            ], 422);
        }

        $latest = $this->latestBlock();
        if ($latest === null) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32000, 'message' => 'The chain read failed.'],
            ], 502);
        }

        $from = $this->parseBlock($filter['fromBlock'] ?? 'latest', $latest);
        $to = $this->parseBlock($filter['toBlock'] ?? 'latest', $latest);
        if ($from === null || $to === null || $to < $from) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32602, 'message' => 'Bad block range.'],
            ], 422);
        }

        $logs = [];
        $cursor = $from;
        $complete = true;
        $chunks = 0;

        while ($cursor <= $to) {
            if ($chunks >= self::LOG_MAX_CHUNKS) {
                $complete = false;
                break;
            }
            $chunkTo = min($cursor + self::LOG_CHUNK_BLOCKS - 1, $to);
            $chunkFilter = array_merge($filter, [
                'fromBlock' => '0x'.dechex($cursor),
                'toBlock' => '0x'.dechex($chunkTo),
            ]);
            $upstream = $this->forward('eth_getLogs', [$chunkFilter], $id);
            if ($upstream === null || isset($upstream['error'])) {
                return response()->json([
                    'jsonrpc' => '2.0',
                    'id' => $id,
                    'error' => $upstream['error'] ?? ['code' => -32000, 'message' => 'The chain read failed.'],
                ], 502);
            }
            $logs = array_merge($logs, $upstream['result'] ?? []);
            $cursor = $chunkTo + 1;
            $chunks++;
        }

        $payload = ['jsonrpc' => '2.0', 'id' => $id, 'result' => $logs];
        if (! $complete) {
            $payload['tress'] = ['complete' => false, 'nextFromBlock' => '0x'.dechex($cursor)];
        }

        return response()->json($payload);
    }

    private function parseBlock(mixed $value, int $latest): ?int
    {
        if (is_int($value)) {
            return $value;
        }
        if (! is_string($value)) {
            return null;
        }
        if ($value === 'latest' || $value === 'pending') {
            return $latest;
        }
        if ($value === 'earliest') {
            return 0;
        }
        if (preg_match('/^0x[0-9a-fA-F]+$/', $value)) {
            return hexdec($value);
        }

        return null;
    }

    private function latestBlock(): ?int
    {
        $res = $this->forward('eth_blockNumber', [], 1);
        if ($res === null || ! isset($res['result']) || ! is_string($res['result'])) {
            return null;
        }

        return hexdec($res['result']);
    }

    private function forward(string $method, array $params, mixed $id): ?array
    {
        try {
            $response = Http::timeout(10)
                ->acceptJson()
                ->post((string) config('tress.rpc_url'), [
                    'jsonrpc' => '2.0',
                    'id' => $id,
                    'method' => $method,
                    'params' => $params,
                ]);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $decoded = $response->json();

        return is_array($decoded) ? $decoded : null;
    }
}
