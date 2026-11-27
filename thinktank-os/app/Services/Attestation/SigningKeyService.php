<?php

namespace App\Services\Attestation;

use RuntimeException;

/**
 * Ed25519 signing keys for Glenride attestations (FIPS 186-5 EdDSA).
 *
 * New issuances sign with Ed25519 so any third party can verify a
 * signature from the published public key, without trusting Glenride's
 * server or sharing a secret. HMAC-signed records issued before
 * November 17, 2026 keep verifying through the legacy path in
 * AttestationService; this service never re-signs them.
 *
 * The private key lives ONLY on the issuing host, encrypted at rest
 * (custody Option A, 2026-11-26): a libsodium secretbox blob plus a
 * separate key-encryption-key file, both delivered as Docker secrets
 * (mode 600 on the host). It is never copied, printed, logged,
 * emailed, or committed. This service decrypts it in memory per
 * signing operation and zeroes the buffers after use. The legacy
 * plaintext ATTESTATION_SIGNING_KEY environment value remains only
 * as a fallback for tests, which inject an ephemeral keypair.
 *
 * Rotation: records carry the key ID they were signed with, and every
 * public key ever used stays in config/attestation.php, so a rotation
 * never breaks verification of older records. See
 * ATTESTATION-PROTOCOL.md section 18.
 *
 * No FIPS 140-3 validated module is in use; none is claimed.
 */
class SigningKeyService
{
    public const METHOD_ED25519 = 'ed25519';

    public const METHOD_HMAC = 'hmac-sha256';

    public function activeKeyId(): string
    {
        return (string) config('attestation.active_key_id', 'glenride-ed25519-2026-11');
    }

    /**
     * The published key registry: key ID => public key record.
     *
     * @return array<string, array{algorithm: string, public_key: string, fingerprint: string, identity: string, effective_from: string, status: string}>
     */
    public function keys(): array
    {
        $keys = config('attestation.keys', []);

        return is_array($keys) ? $keys : [];
    }

    public function publicKeyFor(string $keyId): ?array
    {
        return $this->keys()[$keyId] ?? null;
    }

    /**
     * SHA-256 fingerprint (hex) of a base64 public key's raw bytes.
     */
    public function fingerprint(string $publicKeyBase64): string
    {
        $raw = base64_decode($publicKeyBase64, true);

        if ($raw === false) {
            return '';
        }

        return hash('sha256', $raw);
    }

    /**
     * Sign a canonical payload with the active key.
     *
     * @return array{signature: string, key_id: string, method: string}
     *
     * @throws RuntimeException when no signing key is configured. Issuance
     *                         fails closed: an unsigned attestation is
     *                         never created.
     */
    public function sign(string $payload, ?string $keyId = null): array
    {
        $keyId = $keyId ?? $this->activeKeyId();
        $secret = $this->secretKey();

        $signature = sodium_crypto_sign_detached($payload, $secret);
        sodium_memzero($secret);

        return [
            'signature' => base64_encode($signature),
            'key_id' => $keyId,
            'method' => self::METHOD_ED25519,
        ];
    }

    /**
     * Verify an Ed25519 signature against the published public key for
     * the given key ID. Unknown key IDs and malformed values fail closed.
     */
    public function verify(string $payload, string $signatureBase64, string $keyId): bool
    {
        $record = $this->publicKeyFor($keyId);

        if ($record === null) {
            return false;
        }

        $publicKey = base64_decode((string) ($record['public_key'] ?? ''), true);
        $signature = base64_decode($signatureBase64, true);

        if ($publicKey === false || $signature === false) {
            return false;
        }

        if (strlen($publicKey) !== SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES
            || strlen($signature) !== SODIUM_CRYPTO_SIGN_BYTES) {
            return false;
        }

        return sodium_crypto_sign_verify_detached($signature, $payload, $publicKey);
    }

    /**
     * @throws RuntimeException when the signing key is missing or malformed.
     */
    private function secretKey(): string
    {
        $keyFile = (string) config('attestation.signing_key_file', '');
        $kekFile = (string) config('attestation.kek_file', '');

        if ($keyFile !== '' || $kekFile !== '') {
            return $this->secretKeyFromEncryptedFile($keyFile, $kekFile);
        }

        $encoded = (string) config('attestation.signing_key', '');

        if ($encoded === '') {
            throw new RuntimeException('No attestation signing key is configured (ATTESTATION_SIGNING_KEY). Issuance is blocked until the key is present in the application environment.');
        }

        $raw = base64_decode($encoded, true);

        if ($raw === false || strlen($raw) !== SODIUM_CRYPTO_SIGN_SECRETKEYBYTES) {
            throw new RuntimeException('The configured attestation signing key is malformed. Issuance is blocked.');
        }

        return $raw;
    }

    /**
     * Decrypt the Ed25519 secret from its secretbox file (custody
     * Option A, 2026-11-26). The blob file holds base64(nonce ||
     * secretbox(secret)); the KEK file holds base64(32-byte key).
     * Both arrive as Docker secrets; neither value is ever logged.
     *
     * @throws RuntimeException when the files are missing or the blob
     *                          does not decrypt. Fails closed.
     */
    private function secretKeyFromEncryptedFile(string $keyFile, string $kekFile): string
    {
        if ($keyFile === '' || $kekFile === '' || ! is_readable($keyFile) || ! is_readable($kekFile)) {
            throw new RuntimeException('Encrypted attestation signing key files are configured but not readable. Issuance is blocked.');
        }

        $blob = base64_decode(trim((string) file_get_contents($keyFile)), true);
        $kek = base64_decode(trim((string) file_get_contents($kekFile)), true);

        if ($blob === false || $kek === false
            || strlen($kek) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES
            || strlen($blob) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            throw new RuntimeException('Encrypted attestation signing key material is malformed. Issuance is blocked.');
        }

        $raw = sodium_crypto_secretbox_open(
            substr($blob, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
            substr($blob, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
            $kek
        );
        sodium_memzero($kek);

        if ($raw === false || strlen($raw) !== SODIUM_CRYPTO_SIGN_SECRETKEYBYTES) {
            throw new RuntimeException('Encrypted attestation signing key did not decrypt. Issuance is blocked.');
        }

        return $raw;
    }
}
