<?php

namespace App\Services\PlusIndexer;

use Illuminate\Support\Facades\Http;

/**
 * Read-only JSON-RPC client for Base Sepolia, through the same URL
 * the Tress relay uses (config tress.rpc_url). No sends, no signing.
 */
class RpcClient
{
    public function call(string $method, array $params = []): mixed
    {
        $response = Http::timeout(10)->acceptJson()->post(
            (string) config('tress.rpc_url'),
            ['jsonrpc' => '2.0', 'id' => 1, 'method' => $method, 'params' => $params]
        );

        if (! $response->successful()) {
            return null;
        }

        $decoded = $response->json();

        return $decoded['result'] ?? null;
    }

    public function blockNumber(): ?int
    {
        $result = $this->call('eth_blockNumber');

        return is_string($result) ? (int) hexdec($result) : null;
    }

    public function getLogs(array $filter): ?array
    {
        $result = $this->call('eth_getLogs', [$filter]);

        return is_array($result) ? $result : null;
    }

    public function ethCall(string $to, string $data): ?string
    {
        $result = $this->call('eth_call', [['to' => $to, 'data' => $data], 'latest']);

        return is_string($result) ? $result : null;
    }

    /** Strip a single leading 0x prefix. ltrim($hex, '0x') is wrong
        here: it strips every leading 0 and x, eating real hex digits. */
    public static function strip0x(string $hex): string
    {
        return str_starts_with($hex, '0x') || str_starts_with($hex, '0X')
            ? substr($hex, 2)
            : $hex;
    }

    public static function hexToInt(string $hex): int
    {
        return (int) hexdec(self::strip0x($hex));
    }

    /** Hex to decimal string, for values too large for a PHP int. */
    public static function hexToDecimal(string $hex): string
    {
        $hex = strtolower(self::strip0x($hex));
        $dec = '0';
        for ($i = 0, $len = strlen($hex); $i < $len; $i++) {
            $dec = self::mulAdd($dec, 16, hexdec($hex[$i]));
        }

        return $dec;
    }

    private static function mulAdd(string $dec, int $mul, int $add): string
    {
        $carry = $add;
        $out = '';
        for ($i = strlen($dec) - 1; $i >= 0; $i--) {
            $v = ((int) $dec[$i]) * $mul + $carry;
            $out = ($v % 10).$out;
            $carry = intdiv($v, 10);
        }
        while ($carry > 0) {
            $out = ($carry % 10).$out;
            $carry = intdiv($carry, 10);
        }

        return ltrim($out, '0') === '' ? '0' : ltrim($out, '0');
    }

    public static function wordAt(string $data, int $index): string
    {
        $hex = self::strip0x($data);

        return '0x'.substr($hex, $index * 64, 64);
    }

    public static function wordAddress(string $data, int $index): string
    {
        return '0x'.strtolower(substr(self::strip0x(self::wordAt($data, $index)), 24));
    }

    public static function encodeUintArg(int $value): string
    {
        return str_pad(dechex($value), 64, '0', STR_PAD_LEFT);
    }
}
