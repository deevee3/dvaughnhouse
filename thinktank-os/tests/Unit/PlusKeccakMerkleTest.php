<?php

namespace Tests\Unit;

use App\Support\Plus\Keccak256;
use App\Support\Plus\MerkleTree;
use PHPUnit\Framework\TestCase;

class PlusKeccakMerkleTest extends TestCase
{
    /** Published Keccak-256 vectors. */
    public function test_keccak256_vectors(): void
    {
        $this->assertSame(
            'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
            Keccak256::hash('')
        );
        $this->assertSame(
            '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
            Keccak256::hash('abc')
        );
        $this->assertSame(
            '47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad',
            Keccak256::hash('hello world')
        );
    }

    public function test_decimal_to_hex(): void
    {
        $this->assertSame('0', MerkleTree::decimalToHex('0'));
        $this->assertSame('ff', MerkleTree::decimalToHex('255'));
        $this->assertSame('de0b6b3a7640000', MerkleTree::decimalToHex('1000000000000000000'));
    }

    public function test_merkle_root_proof_and_verify(): void
    {
        $holders = [
            ['address' => '0x1111111111111111111111111111111111111111', 'balance' => '1000'],
            ['address' => '0x2222222222222222222222222222222222222222', 'balance' => '2000'],
            ['address' => '0x3333333333333333333333333333333333333333', 'balance' => '3000'],
        ];
        $leaves = [];
        foreach ($holders as $index => $holder) {
            $leaves[] = MerkleTree::leafFor($index, $holder['address'], $holder['balance']);
        }

        $tree = new MerkleTree($leaves);
        $root = $tree->root();
        $this->assertNotNull($root);

        foreach ($holders as $index => $holder) {
            $leaf = MerkleTree::leafFor($index, $holder['address'], $holder['balance']);
            $this->assertTrue(MerkleTree::verify($leaf, $tree->proof($index), $root));
        }

        // A tampered amount fails verification.
        $badLeaf = MerkleTree::leafFor(0, $holders[0]['address'], '1001');
        $this->assertFalse(MerkleTree::verify($badLeaf, $tree->proof(0), $root));
    }
}
