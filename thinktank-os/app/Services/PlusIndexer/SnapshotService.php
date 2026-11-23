<?php

namespace App\Services\PlusIndexer;

use App\Support\Plus\MerkleTree;

/**
 * No-code Merkle snapshot builder, server side.
 *
 * Holder set at a block, from Transfer events of the chosen token.
 * Filters are explicit, named heuristics, shown to the creator
 * before the root is generated. Exclusions are listed by name;
 * nothing is silently excluded. Bounded: at most 5,000 blocks of
 * Transfer history per compute, and the bound is reported.
 */
class SnapshotService
{
    public const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    public const MAX_SCAN_BLOCKS = 5000;

    private RpcClient $rpc;

    public function __construct(?RpcClient $rpc = null)
    {
        $this->rpc = $rpc ?? new RpcClient;
    }

    /**
     * Compute holders at a block. Filters: min_hold_blocks (exclude
     * wallets whose first incoming transfer is within N blocks of the
     * snapshot block) and exclude_first_n_blocks (exclude wallets
     * first seen within N blocks of the token's first transfer).
     *
     * @return array{holders: array, excluded: array, scanned_from: int, scanned_to: int, complete: bool}
     */
    public function computeHolders(string $token, int $snapshotBlock, array $filters = []): array
    {
        $token = strtolower($token);
        $minHold = (int) ($filters['min_hold_blocks'] ?? 0);
        $excludeFirst = (int) ($filters['exclude_first_n_blocks'] ?? 0);

        $latest = $this->rpc->blockNumber();
        $to = min($snapshotBlock, $latest ?? $snapshotBlock);
        $from = max($to - self::MAX_SCAN_BLOCKS + 1, 0);
        $complete = ($to - $from + 1) <= self::MAX_SCAN_BLOCKS;

        $balances = [];
        $firstSeen = [];
        $logs = $this->rpc->getLogs([
            'address' => $token,
            'topics' => [self::TRANSFER_TOPIC],
            'fromBlock' => '0x'.dechex($from),
            'toBlock' => '0x'.dechex($to),
        ]);
        if ($logs === null) {
            return ['holders' => [], 'excluded' => [], 'scanned_from' => $from, 'scanned_to' => $to, 'complete' => false, 'error' => 'Chain read failed. The holder scan could not reach Base Sepolia.'];
        }

        $firstTransferBlock = null;
        foreach ($logs as $log) {
            $block = RpcClient::hexToInt($log['blockNumber'] ?? '0x0');
            $firstTransferBlock ??= $block;
            $fromAddr = '0x'.strtolower(substr(RpcClient::strip0x($log['topics'][1] ?? ''), 24));
            $toAddr = '0x'.strtolower(substr(RpcClient::strip0x($log['topics'][2] ?? ''), 24));
            $amount = RpcClient::hexToDecimal(RpcClient::wordAt($log['data'] ?? '0x', 0));
            $balances[$fromAddr] = self::sub($balances[$fromAddr] ?? '0', $amount);
            $balances[$toAddr] = self::add($balances[$toAddr] ?? '0', $amount);
            $firstSeen[$fromAddr] ??= $block;
            $firstSeen[$toAddr] ??= $block;
        }

        $holders = [];
        $excluded = [];
        foreach ($balances as $address => $balance) {
            if (self::isZeroOrNegative($balance)) {
                continue;
            }
            if ($address === '0x0000000000000000000000000000000000000000') {
                continue;
            }
            $reasons = [];
            if ($minHold > 0 && ($firstSeen[$address] ?? 0) > $to - $minHold) {
                $reasons[] = 'Held less than '.$minHold.' blocks before the snapshot block';
            }
            if ($excludeFirst > 0 && $firstTransferBlock !== null && ($firstSeen[$address] ?? 0) <= $firstTransferBlock + $excludeFirst) {
                $reasons[] = 'Bought in the first '.$excludeFirst.' blocks after the first transfer';
            }
            if ($reasons) {
                $excluded[] = ['address' => $address, 'balance' => $balance, 'reasons' => $reasons];
            } else {
                $holders[] = ['address' => $address, 'balance' => $balance];
            }
        }

        usort($holders, fn ($a, $b) => strcmp($a['address'], $b['address']));

        return [
            'holders' => $holders,
            'excluded' => $excluded,
            'scanned_from' => $from,
            'scanned_to' => $to,
            'complete' => $complete,
            'first_transfer_block' => $firstTransferBlock,
        ];
    }

    /** Build the Merkle root for a holder list. Leaves are indexed by sorted address order. */
    public function buildRoot(array $holders): array
    {
        $leaves = [];
        foreach ($holders as $index => $holder) {
            $leaves[] = MerkleTree::leafFor($index, $holder['address'], $holder['balance']);
        }
        $tree = new MerkleTree($leaves);

        return ['root' => $tree->root(), 'leaves' => $leaves, 'tree' => $tree];
    }

    public static function add(string $a, string $b): string
    {
        $carry = 0;
        $out = '';
        $a = strrev($a);
        $b = strrev($b);
        $len = max(strlen($a), strlen($b));
        for ($i = 0; $i < $len; $i++) {
            $v = ((int) ($a[$i] ?? 0)) + ((int) ($b[$i] ?? 0)) + $carry;
            $out .= (string) ($v % 10);
            $carry = intdiv($v, 10);
        }
        while ($carry > 0) {
            $out .= (string) ($carry % 10);
            $carry = intdiv($carry, 10);
        }

        return ltrim(strrev($out), '0') === '' ? '0' : ltrim(strrev($out), '0');
    }

    public static function sub(string $a, string $b): string
    {
        if (self::cmp($a, $b) < 0) {
            return '-'.self::sub($b, $a);
        }
        $borrow = 0;
        $out = '';
        $a = strrev($a);
        $b = strrev($b);
        for ($i = 0, $len = strlen($a); $i < $len; $i++) {
            $v = ((int) $a[$i]) - ((int) ($b[$i] ?? 0)) - $borrow;
            if ($v < 0) {
                $v += 10;
                $borrow = 1;
            } else {
                $borrow = 0;
            }
            $out .= (string) $v;
        }

        return ltrim(strrev($out), '0') === '' ? '0' : ltrim(strrev($out), '0');
    }

    public static function cmp(string $a, string $b): int
    {
        $a = ltrim($a, '-');
        $b = ltrim($b, '-');
        if (strlen($a) !== strlen($b)) {
            return strlen($a) <=> strlen($b);
        }

        return strcmp($a, $b);
    }

    public static function isZeroOrNegative(string $value): bool
    {
        return $value === '0' || str_starts_with($value, '-');
    }
}
