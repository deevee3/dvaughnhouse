<?php

namespace Tests\Feature;

use App\Models\Attestation;
use App\Models\IssuanceLogEntry;
use App\Models\User;
use App\Services\Attestation\AttestationService;
use App\Services\Attestation\AttestationStatement;
use App\Services\Attestation\ChainAnchorService;
use App\Services\Attestation\IssuanceChainService;
use App\Services\Attestation\SigningKeyService;
use App\Services\Attestation\TrustedTimestampService;
use App\Support\Markdown\Renderers\AttestationRenderer;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use LogicException;
use ReflectionClass;
use Tests\TestCase;

/**
 * Federal-alignment tests (protocol v2.0, November 17, 2026):
 * the attestation statement, Ed25519 signing with dual verification,
 * key binding, RFC 3161 timestamping, chain append + log protection,
 * anchoring, corrections, authority, and the deposit package.
 *
 * The base TestCase provisions an ephemeral Ed25519 keypair per test
 * and disables timestamping by default; timestamp tests opt in.
 */
class FederalAlignmentTest extends TestCase
{
    use RefreshDatabase;

    private User $orchestrator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orchestrator = User::factory()->create(['role' => 'orchestrator']);
    }

    private function service(): AttestationService
    {
        return app(AttestationService::class);
    }

    private function issueManual(array $overrides = [], string $enteredVia = 'manual'): Attestation
    {
        return $this->service()->issueManual(array_merge([
            'subject_title' => 'A finished, fixed work',
            'claim' => 'Glenride attests this work is exactly as described in the record.',
            'subject_kind' => 'report',
            'subject_hash_override' => hash('sha256', uniqid('subject-', true)),
        ], $overrides), $this->orchestrator, $enteredVia);
    }

    // -----------------------------------------------------------------
    // The attestation statement
    // -----------------------------------------------------------------

    public function test_the_statement_renders_verbatim_with_correct_fields(): void
    {
        $attestation = $this->issueManual();

        $statement = $attestation->statement();

        // Fixed wording, verbatim.
        $this->assertStringContainsString('ATTESTATION STATEMENT', $statement);
        $this->assertStringContainsString("I, D'Vaughn House, principal of Glenride, attest the following about the artifact identified below.", $statement);
        $this->assertStringContainsString('This attestation certifies the identity, origin, and integrity of this record. It does not certify the truth of third-party data the record reports.', $statement);
        $this->assertStringContainsString('Glenride follows the federal standards named in its attestation protocol in good faith. Glenride is not a federal agency. This attestation is not a federal certification, and no federal agency has endorsed it.', $statement);

        // Per-record fields.
        $this->assertStringContainsString('Artifact: A finished, fixed work', $statement);
        $this->assertStringContainsString('Kind: report', $statement);
        $this->assertStringContainsString('Identifier: '.$attestation->public_id, $statement);
        $this->assertStringContainsString('/attestations/'.$attestation->public_id, $statement);
        $this->assertStringContainsString('Fingerprint (SHA-256): '.$attestation->subject_hash, $statement);
        $this->assertStringContainsString('Claim: Glenride attests this work is exactly as described in the record.', $statement);
    }

    public function test_the_statement_has_both_method_variants(): void
    {
        $manual = $this->issueManual([], 'manual');
        $automated = $this->issueManual([
            'subject_title' => 'Glenride Weekly Drug Shortage Digest — October 19, 2026',
            'subject_hash_override' => hash('sha256', 'automated-digest'),
        ], 'automated');

        $this->assertStringContainsString('Method: directly by the human principal', $manual->statement());
        $this->assertStringContainsString('Method: automatically under standing authorization dated November 17, 2026', $automated->statement());
        $this->assertStringNotContainsString('standing authorization', $manual->statement());
    }

    public function test_the_statement_renders_on_the_markdown_surface(): void
    {
        $attestation = $this->issueManual();

        $document = AttestationRenderer::render(['key' => $attestation->public_id]);

        $this->assertNotNull($document);
        $bodies = array_column($document->sections, 'body');
        $this->assertSame('Attestation statement', $document->sections[0]['heading']);
        $this->assertStringContainsString('ATTESTATION STATEMENT', $bodies[0]);
        $this->assertStringContainsString($attestation->claim, $bodies[0]);
        $this->assertSame('Signature', $document->sections[1]['heading']);
        $this->assertStringContainsString("D'Vaughn House", $bodies[1]);
        $this->assertStringContainsString('Key ID:', $bodies[1]);
    }

    public function test_the_markdown_route_serves_the_statement(): void
    {
        $attestation = $this->issueManual();

        $this->get('/attestations/'.$attestation->public_id.'.md')
            ->assertOk()
            ->assertSee('ATTESTATION STATEMENT', false)
            ->assertSee($attestation->public_id, false);
    }

    public function test_the_show_page_carries_the_statement_above_the_signature_block(): void
    {
        $attestation = $this->issueManual();

        $this->get(route('attestations.show', $attestation->public_id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('statement', fn ($s) => str_contains((string) $s, 'ATTESTATION STATEMENT'))
                ->where('signature_block.printed_name', "D'Vaughn House")
                ->where('signature_block.role', 'principal of Glenride')
                ->where('signature_valid', true)
            );
    }

    public function test_the_signature_block_names_method_key_and_timestamp(): void
    {
        $attestation = $this->issueManual();

        $block = $attestation->signatureBlock();

        $this->assertSame("D'Vaughn House", $block['printed_name']);
        $this->assertSame('principal of Glenride', $block['role']);
        $this->assertSame($attestation->signature, $block['signature_value']);
        $this->assertSame('ed25519', $block['signature_method']);
        $this->assertSame('test-ed25519-1', $block['key_id']);
        $this->assertStringContainsString(
            $attestation->issued_at->copy()->setTimezone('America/New_York')->format('F j, Y'),
            $block['date_time']
        );
        $this->assertStringContainsString($attestation->issued_at->format('c'), $block['date_time']);
    }

    // -----------------------------------------------------------------
    // Gap 1: asymmetric signatures / dual verification
    // -----------------------------------------------------------------

    public function test_a_new_issuance_verifies_by_public_key(): void
    {
        $attestation = $this->issueManual();

        $this->assertSame('ed25519', $attestation->signature_method);
        $this->assertSame('test-ed25519-1', $attestation->key_id);
        $this->assertTrue($this->service()->verifySignature($attestation));

        // Independent check: raw sodium verification against the
        // published public key from config, outside the service.
        $keys = app(SigningKeyService::class);
        $public = base64_decode($keys->publicKeyFor('test-ed25519-1')['public_key']);
        $this->assertTrue(sodium_crypto_sign_verify_detached(
            base64_decode($attestation->signature),
            $this->service()->signedPayload($attestation),
            $public
        ));
    }

    public function test_a_tampered_record_fails_verification(): void
    {
        $attestation = $this->issueManual();
        $this->assertTrue($this->service()->verifySignature($attestation));

        Attestation::where('id', $attestation->id)->update(['claim' => 'A forged claim.']);
        $this->assertFalse($this->service()->verifySignature($attestation->fresh()));

        Attestation::where('id', $attestation->id)->update([
            'claim' => $attestation->claim,
            'subject_hash' => str_repeat('0', 64),
        ]);
        $this->assertFalse($this->service()->verifySignature($attestation->fresh()));
    }

    public function test_tampering_with_the_statement_breaks_verification(): void
    {
        // The statement is inside the signed payload: any field the
        // statement carries (title, hash, claim, method) is covered.
        $attestation = $this->issueManual();
        $payload = $this->service()->signedPayload($attestation);
        // The payload carries the statement as a JSON string (newlines
        // escaped), so assert on newline-free spans of the statement.
        $this->assertStringContainsString('ATTESTATION STATEMENT', $payload);
        $this->assertStringContainsString("I, D'Vaughn House, principal of Glenride, attest", $payload);
        $this->assertStringContainsString($attestation->claim, $payload);

        Attestation::where('id', $attestation->id)->update(['subject_title' => 'A different title']);
        $this->assertFalse($this->service()->verifySignature($attestation->fresh()));
    }

    public function test_a_legacy_hmac_record_still_verifies_exactly_as_issued(): void
    {
        $issuedAt = now();
        $publicId = 'GLR-AT-2026-LEGACY';
        $subjectHash = hash('sha256', 'legacy subject');

        $method = (new ReflectionClass(AttestationService::class))->getMethod('sign');
        $method->setAccessible(true);
        $signature = $method->invoke($this->service(), $publicId, '', '', $subjectHash, $issuedAt->format('c'));

        $legacy = Attestation::create([
            'public_id' => $publicId,
            'attestable_type' => null,
            'attestable_id' => null,
            'subject_kind' => 'report',
            'entered_via' => 'automated',
            'subject_title' => 'Glenride Weekly Drug Shortage Digest — October 19, 2026',
            'claim' => 'A legacy claim.',
            'evidence_manifest' => ['human_principal' => IssuanceChainService::HUMAN_PRINCIPAL],
            'subject_hash' => $subjectHash,
            'signature' => $signature,
            'signature_method' => null,
            'key_id' => null,
            'verifier_id' => $this->orchestrator->id,
            'issuer_name' => 'Glenride',
            'method' => 'automated_digest_v1',
            'status' => 'issued',
            'issued_at' => $issuedAt,
        ]);

        $this->assertTrue($this->service()->verifySignature($legacy));
        $this->assertFalse($legacy->isEd25519());
        // And the statement still displays from its stored fields.
        $this->assertStringContainsString('ATTESTATION STATEMENT', $legacy->statement());
        $this->assertStringContainsString('automatically under standing authorization', $legacy->statement());
    }

    public function test_verification_fails_closed_for_an_unknown_key_id(): void
    {
        $attestation = $this->issueManual();

        Attestation::where('id', $attestation->id)->update(['key_id' => 'no-such-key']);

        $this->assertFalse($this->service()->verifySignature($attestation->fresh()));
    }

    // -----------------------------------------------------------------
    // Gap 2 + 4: key binding and rotation
    // -----------------------------------------------------------------

    public function test_the_key_statement_page_publishes_key_fingerprint_identity_and_revocation(): void
    {
        $configured = config('attestation.keys')['test-ed25519-1'];

        $this->get(route('attestations.keyStatement'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('active_key_id', 'test-ed25519-1')
                ->where('identity', "D'Vaughn House, principal of Glenride")
                ->where('keys.test-ed25519-1.public_key', $configured['public_key'])
                ->where('keys.test-ed25519-1.fingerprint', $configured['fingerprint'])
            );

        $keys = app(SigningKeyService::class);
        $this->assertSame(
            hash('sha256', base64_decode($configured['public_key'])),
            $keys->fingerprint($configured['public_key'])
        );
    }

    public function test_rotation_does_not_break_old_verifications(): void
    {
        // Issue under a key that is then retired.
        $retired = sodium_crypto_sign_keypair();
        $retiredSecret = sodium_crypto_sign_secretkey($retired);
        $retiredPublic = sodium_crypto_sign_publickey($retired);

        config([
            'attestation.keys.test-ed25519-0' => [
                'algorithm' => 'Ed25519',
                'public_key' => base64_encode($retiredPublic),
                'fingerprint' => hash('sha256', $retiredPublic),
                'identity' => "D'Vaughn House, principal of Glenride",
                'effective_from' => '2026-11-17',
                'status' => 'retired',
            ],
            'attestation.signing_key' => base64_encode($retiredSecret),
            'attestation.active_key_id' => 'test-ed25519-0',
        ]);

        $old = $this->issueManual();
        $this->assertSame('test-ed25519-0', $old->key_id);

        // Rotate back to the current test key and issue again.
        $current = sodium_crypto_sign_keypair();
        config([
            'attestation.signing_key' => base64_encode(sodium_crypto_sign_secretkey($current)),
            'attestation.active_key_id' => 'test-ed25519-1',
        ]);
        config(['attestation.keys.test-ed25519-1.public_key' => base64_encode(sodium_crypto_sign_publickey($current))]);
        config(['attestation.keys.test-ed25519-1.fingerprint' => hash('sha256', sodium_crypto_sign_publickey($current))]);

        $new = $this->issueManual();
        $this->assertSame('test-ed25519-1', $new->key_id);

        // Both verify: the retired key stays published.
        $this->assertTrue($this->service()->verifySignature($old->fresh()));
        $this->assertTrue($this->service()->verifySignature($new->fresh()));

        sodium_memzero($retiredSecret);
    }

    // -----------------------------------------------------------------
    // Gap 3: trusted timestamping
    // -----------------------------------------------------------------

    private function fixtureData(): string
    {
        return (string) file_get_contents(base_path('tests/Fixtures/Attestation/timestamp-fixture-data.bin'));
    }

    private function fixtureToken(): string
    {
        return (string) file_get_contents(base_path('tests/Fixtures/Attestation/timestamp-fixture-token.b64'));
    }

    public function test_an_rfc3161_token_verifies_offline_against_its_payload(): void
    {
        $timestamps = app(TrustedTimestampService::class);

        $this->assertTrue($timestamps->verify($this->fixtureData(), $this->fixtureToken()));
        $this->assertFalse($timestamps->verify('different bytes entirely', $this->fixtureToken()));
        $this->assertFalse($timestamps->verify($this->fixtureData(), 'not-a-token'));
    }

    public function test_an_issuance_stores_the_timestamp_token_and_source(): void
    {
        config(['attestation.timestamp_enabled' => true]);
        Http::fake(['freetsa.org/*' => Http::response(base64_decode($this->fixtureToken()), 200)]);

        $attestation = $this->issueManual();

        $this->assertSame('timestamped', $attestation->timestamp_status);
        $this->assertNotEmpty($attestation->timestamp_token);
        $this->assertSame('https://freetsa.org/tsr', $attestation->timestamp_source);
        $this->assertNotNull($attestation->timestamped_at);
    }

    public function test_a_failed_timestamp_request_never_blocks_issuance(): void
    {
        config(['attestation.timestamp_enabled' => true]);
        Http::fake(['freetsa.org/*' => Http::response(null, 500)]);

        $attestation = $this->issueManual();

        $this->assertSame('issued', $attestation->status);
        $this->assertSame('failed', $attestation->timestamp_status);
        $this->assertNull($attestation->timestamp_token);
        $this->assertTrue($this->service()->verifySignature($attestation));
    }

    public function test_the_timestamp_retry_command_stamps_pending_records(): void
    {
        $attestation = $this->issueManual();
        $this->assertSame('failed', $attestation->timestamp_status);

        config(['attestation.timestamp_enabled' => true]);
        Http::fake(['freetsa.org/*' => Http::response(base64_decode($this->fixtureToken()), 200)]);

        $this->artisan('attestations:timestamp-missing')->assertExitCode(0);

        $this->assertSame('timestamped', $attestation->fresh()->timestamp_status);
        $this->assertNotEmpty($attestation->fresh()->timestamp_token);
    }

    public function test_verify_timestamp_reports_absence_for_records_without_a_token(): void
    {
        $attestation = $this->issueManual();

        $this->assertFalse($this->service()->verifyTimestamp($attestation));
    }

    // -----------------------------------------------------------------
    // Gap 5: chain append for every issuance + log protection + anchors
    // -----------------------------------------------------------------

    public function test_a_manual_issuance_appends_to_the_chain(): void
    {
        $attestation = $this->issueManual();

        $this->assertSame(2, IssuanceLogEntry::count());
        $entry = IssuanceLogEntry::where('seq', 1)->first();
        $this->assertSame($attestation->public_id, $entry->public_id);
        $this->assertSame([], $entry->gates_passed);
        $this->assertSame(AttestationService::DIRECT_AUTHORIZATION, $entry->authorization);
        $this->assertTrue(app(IssuanceChainService::class)->verify()['valid']);
    }

    public function test_the_issuance_log_refuses_eloquent_updates_and_deletes(): void
    {
        $this->issueManual();
        $entry = IssuanceLogEntry::where('seq', 1)->first();

        $entry->subject_hash = str_repeat('0', 64);
        $this->expectException(LogicException::class);
        $entry->save();
    }

    public function test_the_issuance_log_refuses_deletion(): void
    {
        $this->issueManual();
        $entry = IssuanceLogEntry::where('seq', 1)->first();

        $this->expectException(LogicException::class);
        $entry->delete();
    }

    public function test_an_anchor_round_trips_against_the_live_chain(): void
    {
        $this->issueManual();
        $this->issueManual();

        $anchors = app(ChainAnchorService::class);
        $anchor = $anchors->buildAnchor();

        $this->assertNotNull($anchor);
        $this->assertSame(2, $anchor['seq']);
        $this->assertTrue($anchors->verifyAnchor($anchor)['valid']);

        $tampered = $anchor;
        $tampered['chain_digest'] = str_repeat('0', 64);
        $this->assertFalse($anchors->verifyAnchor($tampered)['valid']);
    }

    public function test_the_anchor_command_writes_a_verifiable_anchor_file(): void
    {
        Storage::fake('local');
        $this->issueManual();

        $this->artisan('attestations:anchor-chain', ['--path' => 'attestation-anchors/test-anchor.json'])
            ->assertExitCode(0);

        Storage::disk('local')->assertExists('attestation-anchors/test-anchor.json');
        $anchor = json_decode(Storage::disk('local')->get('attestation-anchors/test-anchor.json'), true);
        $this->assertTrue(app(ChainAnchorService::class)->verifyAnchor($anchor)['valid']);
    }

    // -----------------------------------------------------------------
    // Gap 7 + 8: authorization evidence + authority checks
    // -----------------------------------------------------------------

    public function test_every_issuance_records_issuer_authorization_and_principal(): void
    {
        $attestation = $this->issueManual();

        $this->assertSame($this->orchestrator->id, $attestation->verifier_id);
        $this->assertSame(AttestationService::DIRECT_AUTHORIZATION, $attestation->authorization_evidence);
        $this->assertSame(IssuanceChainService::HUMAN_PRINCIPAL, $attestation->evidence_manifest['human_principal']);
        $this->assertSame(AttestationService::DIRECT_AUTHORIZATION, $attestation->evidence_manifest['authorization']);
    }

    public function test_a_non_issuer_cannot_issue_or_correct(): void
    {
        $plain = User::factory()->create();

        $this->actingAs($plain)
            ->post(route('attestations.storeManual'), [
                'subject_title' => 'Nope',
                'claim' => 'This must not issue.',
                'subject_kind' => 'other',
            ])
            ->assertForbidden();

        $attestation = $this->issueManual();

        $this->actingAs($plain)
            ->post(route('attestations.correct', $attestation), [
                'claim' => 'A forged correction claim.',
                'reason' => 'No authority to do this.',
            ])
            ->assertForbidden();

        $this->assertSame(1, Attestation::count());
    }

    public function test_a_guest_cannot_issue(): void
    {
        $this->post(route('attestations.storeManual'), [
            'subject_title' => 'Nope',
            'claim' => 'This must not issue.',
            'subject_kind' => 'other',
        ])->assertRedirect(route('login'));
    }

    // -----------------------------------------------------------------
    // Gap 9: non-obscuring correction
    // -----------------------------------------------------------------

    public function test_a_correction_appends_a_linked_version_and_keeps_the_original(): void
    {
        $original = $this->issueManual(['claim' => 'The original claim, with an error in it.']);

        $correction = $this->service()->correct($original, [
            'claim' => 'The corrected claim, with the error fixed.',
        ], $this->orchestrator, 'Fixed a wording error in the claim.');

        $this->assertSame(2, $correction->version);
        $this->assertSame($original->id, $correction->supersedes_id);
        $this->assertSame('correction_v1', $correction->method);
        $this->assertNotSame($original->public_id, $correction->public_id);
        $this->assertTrue($this->service()->verifySignature($correction));
        $this->assertSame($original->public_id, $correction->evidence_manifest['correction']['corrects_public_id']);

        // The original is untouched and readable, marked superseded.
        $original = $original->fresh();
        $this->assertSame('issued', $original->status);
        $this->assertSame('The original claim, with an error in it.', $original->claim);
        $this->assertTrue($original->isSuperseded());
        $this->assertSame($correction->public_id, $original->supersededBy->public_id);
        $this->assertTrue($this->service()->verifySignature($original));
        $this->assertTrue(app(IssuanceChainService::class)->verify()['valid']);
    }

    public function test_a_revoked_record_cannot_be_corrected(): void
    {
        $original = $this->issueManual();
        $this->service()->revoke($original, 'Withdrawn.');

        $this->expectException(DomainException::class);
        $this->service()->correct($original, ['claim' => 'Too late.'], $this->orchestrator, 'Must fail.');
    }

    public function test_revoke_keeps_the_record_and_its_history_readable(): void
    {
        $attestation = $this->issueManual();
        $this->service()->revoke($attestation, 'Withdrawn pending review.');

        $this->assertSame('revoked', $attestation->fresh()->status);
        $this->assertNotNull($attestation->fresh()->revoked_at);

        $this->get(route('attestations.show', $attestation->public_id))->assertOk();
        $this->assertSame(2, IssuanceLogEntry::count());
        $this->assertTrue(app(IssuanceChainService::class)->verify()['valid']);
        $this->assertTrue($this->service()->verifySignature($attestation->fresh()));
    }

    // -----------------------------------------------------------------
    // Gap 10: deposit package
    // -----------------------------------------------------------------

    public function test_the_deposit_package_exports_metadata_without_depositing(): void
    {
        Storage::fake('local');
        $attestation = $this->issueManual();

        $this->artisan('attestations:deposit-package')
            ->assertExitCode(0)
            ->expectsOutputToContain('NOT deposited');

        $dir = 'deposit-packages/'.now()->format('Y-m-d');
        Storage::disk('local')->assertExists($dir.'/registry-metadata.json');
        Storage::disk('local')->assertExists($dir.'/README.md');

        $records = json_decode(Storage::disk('local')->get($dir.'/registry-metadata.json'), true);
        $this->assertCount(1, $records);
        $this->assertSame($attestation->public_id, $records[0]['identifier']);
        $this->assertSame($attestation->subject_hash, $records[0]['subject_hash_sha256']);
        $this->assertSame('ed25519', $records[0]['signature_method']);
        $this->assertStringContainsString('/attestations/'.$attestation->public_id, $records[0]['url']);
    }

    // -----------------------------------------------------------------
    // Gap 11 + statement meaning, and the verify command
    // -----------------------------------------------------------------

    public function test_the_statement_states_what_attested_means(): void
    {
        $statement = AttestationStatement::renderFromFields(
            subjectTitle: 'A work',
            subjectKind: 'report',
            publicId: 'GLR-AT-2026-XXXXXX',
            stableUrl: 'https://dvaughnhouse.org/attestations/GLR-AT-2026-XXXXXX',
            subjectHash: str_repeat('a', 64),
            issuedAt: now(),
            enteredVia: 'manual',
            claim: 'A claim.',
        );

        $this->assertStringContainsString('identity, origin, and integrity', $statement);
        $this->assertStringContainsString('does not certify the truth of third-party data', $statement);
        $this->assertStringContainsString('not a federal certification', $statement);
    }

    public function test_the_verify_command_reports_signature_timestamp_and_chain(): void
    {
        $attestation = $this->issueManual();

        $this->artisan('attestations:verify-timestamp', ['public_id' => $attestation->public_id])
            ->expectsOutputToContain('Signature: VALID')
            ->expectsOutputToContain('NONE ON FILE')
            ->expectsOutputToContain('Issuance log: seq 1')
            ->assertExitCode(0);
    }
}
