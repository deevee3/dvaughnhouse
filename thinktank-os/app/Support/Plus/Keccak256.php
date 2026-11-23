<?php

namespace App\Support\Plus;

/**
 * Pure-PHP Keccak-256 (the hash Ethereum calls keccak256).
 *
 * No vendor library provides it in this app, and the snapshot builder
 * needs real roots: AirdropDistributor leaves are
 * keccak256(abi.encodePacked(index, account, amount)). This is the
 * standard Keccak-f[1600] sponge, rate 1088, suffix 0x01. Verified
 * against the published vectors in PlusKeccakMerkleTest.
 */
class Keccak256
{
    // Round constants as signed decimals: PHP parses 0x8000… literals
    // above PHP_INT_MAX as float, which corrupts the state. These are
    // the same 64-bit patterns, written as two's-complement ints.
    private const RC = [
        1, 32898, -9223372036854742902,
        -9223372034707259392, 32907, 2147483649,
        -9223372034707259263, -9223372036854743031, 138,
        136, 2147516425, 2147483658,
        2147516555, -9223372036854775669, -9223372036854742903,
        -9223372036854743037, -9223372036854743038, -9223372036854775680,
        32778, -9223372034707292150, -9223372034707259263,
        -9223372036854742912, 2147483649, -9223372034707259384,
    ];

    private const R = [
        [0, 36, 3, 41, 18],
        [1, 44, 10, 45, 2],
        [62, 6, 43, 15, 61],
        [28, 55, 25, 21, 56],
        [27, 20, 39, 8, 14],
    ];

    public static function hash(string $data): string
    {
        return bin2hex(self::hashRaw($data));
    }

    public static function hashRaw(string $data): string
    {
        $state = array_fill(0, 25, 0);
        $rate = 136; // 1088 bits
        $len = strlen($data);
        $offset = 0;

        while ($len - $offset >= $rate) {
            self::absorbBlock($state, substr($data, $offset, $rate));
            $offset += $rate;
        }

        $block = substr($data, $offset)."\x01".str_repeat("\x00", $rate - ($len - $offset) - 1);
        $block[$rate - 1] = chr(ord($block[$rate - 1]) | 0x80);
        self::absorbBlock($state, $block);

        $out = '';
        for ($i = 0; $i < 4; $i++) {
            $out .= self::laneToBytes($state[$i]);
        }

        return $out;
    }

    private static function absorbBlock(array &$state, string $block): void
    {
        for ($i = 0; $i < 17; $i++) {
            $state[$i] ^= self::bytesToLane(substr($block, $i * 8, 8));
        }
        self::permute($state);
    }

    private static function bytesToLane(string $bytes): int
    {
        $v = 0;
        for ($i = 7; $i >= 0; $i--) {
            $v = ($v << 8) | ord($bytes[$i]);
        }

        return $v;
    }

    private static function laneToBytes(int $v): string
    {
        $out = '';
        for ($i = 0; $i < 8; $i++) {
            $out .= chr($v & 0xff);
            $v >>= 8;
        }

        return $out;
    }

    private static function rotl(int $x, int $n): int
    {
        if ($n === 0) {
            return $x;
        }

        // Logical right shift: mask off the sign extension PHP's
        // arithmetic >> would otherwise leave in the high bits.
        return ($x << $n) | (($x >> (64 - $n)) & ((1 << $n) - 1));
    }

    private static function permute(array &$a): void
    {
        for ($round = 0; $round < 24; $round++) {
            $c = [];
            for ($x = 0; $x < 5; $x++) {
                $c[$x] = $a[$x] ^ $a[$x + 5] ^ $a[$x + 10] ^ $a[$x + 15] ^ $a[$x + 20];
            }
            for ($x = 0; $x < 5; $x++) {
                $d = $c[($x + 4) % 5] ^ self::rotl($c[($x + 1) % 5], 1);
                for ($y = 0; $y < 25; $y += 5) {
                    $a[$y + $x] ^= $d;
                }
            }

            $b = array_fill(0, 25, 0);
            for ($x = 0; $x < 5; $x++) {
                for ($y = 0; $y < 5; $y++) {
                    $b[$y + 5 * ((2 * $x + 3 * $y) % 5)] = self::rotl($a[$x + 5 * $y], self::R[$x][$y]);
                }
            }
            for ($x = 0; $x < 5; $x++) {
                for ($y = 0; $y < 5; $y++) {
                    $a[$x + 5 * $y] = $b[$x + 5 * $y] ^ ((~$b[(($x + 1) % 5) + 5 * $y]) & $b[(($x + 2) % 5) + 5 * $y]);
                }
            }
            $a[0] ^= self::RC[$round];
        }
    }
}
