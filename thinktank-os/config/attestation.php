<?php

/*
|--------------------------------------------------------------------------
| Glenride attestation signing keys and trusted timestamping
|--------------------------------------------------------------------------
|
| Public keys are PUBLIC material: they are published on the key
| statement page and in the protocol so anyone can verify a signature
| without trusting Glenride's server. The private signing key is NEVER
| in this file: it lives only in the application environment
| (ATTESTATION_SIGNING_KEY, base64) on the issuing host, mode 600,
| and is never copied, printed, logged, or committed.
|
| Rotation: add the new key here under a new key ID, set
| ATTESTATION_KEY_ID to the new ID, and replace the environment secret.
| Old public keys stay listed (status retired/revoked) forever, so
| signatures made under them keep verifying. See ATTESTATION-PROTOCOL.md
| section 18 (key management) for the full procedure.
|
| No FIPS 140-3 validated module is in use; none is claimed.
|
*/

return [
    /*
     * The key ID new issuances sign under. Records carry the key ID they
     * were signed with, so verification always uses the right public key.
     */
    'active_key_id' => env('ATTESTATION_KEY_ID', 'glenride-ed25519-2026-11'),

    /*
     * Base64-encoded Ed25519 secret key (libsodium). Read from the
     * environment only. Tests override this config value with an
     * ephemeral keypair; production reads the host environment.
     */
    'signing_key' => env('ATTESTATION_SIGNING_KEY'),

    /*
     * Published public keys, by key ID. The fingerprint is the SHA-256
     * (hex) of the raw 32-byte public key. The binding below is Glenride's
     * published statement; it is NOT a certificate issued by a
     * certificate authority.
     */
    'keys' => [
        'glenride-ed25519-2026-11' => [
            'algorithm' => 'Ed25519',
            'public_key' => '/WCuHz/Zurc3HM7hCf1ygLmKA3lgEA1/ju7YbFn5UIc=',
            'fingerprint' => 'ccd5920c4541b769e8a084cf1753dda6f33edd85b6c6479f25ddcc7d3327a600',
            'identity' => "D'Vaughn House, principal of Glenride",
            'effective_from' => '2026-11-17',
            'status' => 'active',
        ],
    ],

    /*
     * RFC 3161 trusted timestamping (free TSA). A timestamp token is
     * requested for each new issuance and stored on the record. If the
     * TSA is unreachable, issuance still completes and the record is
     * marked timestamp-pending; the attestations:timestamp-missing
     * command retries. No timestamp is ever invented.
     */
    'timestamp_enabled' => env('ATTESTATION_TIMESTAMP_ENABLED', true),
    'tsa_url' => env('ATTESTATION_TSA_URL', 'https://freetsa.org/tsr'),
    'tsa_cacert' => resource_path('certs/freetsa/cacert.pem'),
    'tsa_cert' => resource_path('certs/freetsa/tsa.crt'),
];
