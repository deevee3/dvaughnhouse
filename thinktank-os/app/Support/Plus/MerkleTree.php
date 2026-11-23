<?php

namespace App\Support\Plus;

/**
 * Merkle tree matching OpenZeppelin's MerkleProof verification:
 * leaves are hashed pairwise with the pair sorted first, and an odd
 * leaf is duplicated at each level. Proofs generated here verify
 * against AirdropDistributor.claim, whose leaves are
 * keccak256(abi.encodePacked(index, account, amount)).
 */
class MerkleTree
{
    /** @var string[] hex leaves, 0x-prefixed, in leaf order */
    private array $leaves;

    /** @var string[][] levels, level 0 is the leaves */
    private array $levels = [];

    public static function leafFor(int $index, string $account, string $amountWei): string
    {
        $packed = self::uint256Bytes($index)
            .self::addressBytes($account)
            .self::uint256Bytes($amountWei);

        return '0x'.Keccak256::hash($packed);
    }

    public static function uint256Bytes(int|string $value): string
    {
        $hex = self::decimalToHex((string) $value);

        return hex2bin(str_pad($hex, 64, '0', STR_PAD_LEFT));
    }

    public static function addressBytes(string $address): string
    {
        $hex = strtolower(str_starts_with($address, '0x') ? substr($address, 2) : $address);

        return hex2bin(str_pad($hex, 20 * 2, '0', STR_PAD_LEFT));
    }

    /** Decimal string to hex, no extension needed. */
    public static function decimalToHex(string $decimal): string
    {
        $decimal = ltrim($decimal, '0');
        if ($decimal === '') {
            return '0';
        }
        $hex = '';
        while ($decimal !== '' && $decimal !== '0') {
            $remainder = 0;
            $next = '';
            for ($i = 0, $len = strlen($decimal); $i < $len; $i++) {
                $digit = $remainder * 10 + (int) $decimal[$i];
                $q = intdiv($digit, 16);
                $remainder = $digit % 16;
                if ($next !== '' || $q !== 0) {
                    $next .= (string) $q;
                }
            }
            $hex = dechex($remainder).$hex;
            $decimal = $next;
        }

        return $hex === '' ? '0' : $hex;
    }

    /** @param string[] $leaves hex leaves, 0x-prefixed */
    public function __construct(array $leaves)
    {
        $this->leaves = array_values($leaves);
        $this->build();
    }

    public function root(): ?string
    {
        $top = end($this->levels);

        return $top ? $top[0] : null;
    }

    /** @return string[] sibling hashes, leaf level first */
    public function proof(int $index): array
    {
        $proof = [];
        $idx = $index;
        foreach ($this->levels as $level) {
            if (count($level) <= 1) {
                break;
            }
            $sibling = $idx % 2 === 0 ? $idx + 1 : $idx - 1;
            if ($sibling >= count($level)) {
                $sibling = $idx; // duplicated odd leaf
            }
            $proof[] = $level[$sibling];
            $idx = intdiv($idx, 2);
        }

        return $proof;
    }

    public static function verify(string $leaf, array $proof, string $root): bool
    {
        $hash = strtolower($leaf);
        foreach ($proof as $sibling) {
            $sibling = strtolower($sibling);
            $pair = strcmp($hash, $sibling) <= 0
                ? substr($hash, 2).substr($sibling, 2)
                : substr($sibling, 2).substr($hash, 2);
            $hash = '0x'.Keccak256::hash(hex2bin($pair));
        }

        return strtolower($hash) === strtolower($root);
    }

    private function build(): void
    {
        $level = array_map(fn ($leaf) => strtolower($leaf), $this->leaves);
        $this->levels[] = $level;
        while (count($level) > 1) {
            $next = [];
            for ($i = 0; $i < count($level); $i += 2) {
                $left = $level[$i];
                $right = $level[$i + 1] ?? $left;
                $pair = strcmp($left, $right) <= 0
                    ? substr($left, 2).substr($right, 2)
                    : substr($right, 2).substr($left, 2);
                $next[] = '0x'.Keccak256::hash(hex2bin($pair));
            }
            $level = $next;
            $this->levels[] = $level;
        }
    }
}
