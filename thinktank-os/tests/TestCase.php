<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Every test runs with an ephemeral Ed25519 attestation keypair:
     * new issuances sign under it, and verification uses its published
     * public key from config. The real production key is never read,
     * copied, or needed by any test. Trusted timestamping is disabled
     * by default so suites stay offline and fast; tests that cover
     * timestamping opt in per test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $keypair = sodium_crypto_sign_keypair();
        $secret = sodium_crypto_sign_secretkey($keypair);
        $public = sodium_crypto_sign_publickey($keypair);

        config([
            'attestation.active_key_id' => 'test-ed25519-1',
            'attestation.signing_key' => base64_encode($secret),
            'attestation.keys' => [
                'test-ed25519-1' => [
                    'algorithm' => 'Ed25519',
                    'public_key' => base64_encode($public),
                    'fingerprint' => hash('sha256', $public),
                    'identity' => "D'Vaughn House, principal of Glenride",
                    'effective_from' => '2026-11-17',
                    'status' => 'active',
                ],
            ],
            'attestation.timestamp_enabled' => false,
        ]);

        sodium_memzero($secret);
    }
}
