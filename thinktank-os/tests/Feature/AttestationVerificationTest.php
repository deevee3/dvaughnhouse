<?php

namespace Tests\Feature;

use App\Models\Attestation;
use App\Models\Manuscript;
use App\Models\User;
use App\Services\Attestation\AttestationService;
use App\Services\SpinWave\RecordService;
use Carbon\Carbon;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use LogicException;
use ReflectionClass;
use Tests\TestCase;

class AttestationVerificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * MC task 140 (mission 48, Witness: Glenride's attestation layer).
     *
     * Sample attestation: GLR-AT-2026-SN6RRF. As of 2026-11-17 the live
     * registry holds zero attestations, so no live row carries this ID.
     * These tests rebuild the record with that exact public ID in an
     * isolated test database and prove the two invariants a live record
     * must satisfy: hash parity with the SpinWave manuscript record, and
     * exact HMAC-SHA256 signature recomputation.
     */
    public const SAMPLE_PUBLIC_ID = 'GLR-AT-2026-SN6RRF';

    private const BRIEF_PATH = 'manuscripts/briefs/verification-fixture-brief.md';

    private const RAW_PATH = 'manuscripts/raw/verification-fixture-raw.pdf';

    private function issuer(): User
    {
        return User::factory()->create(['role' => 'editor']);
    }

    private function plainUser(): User
    {
        return User::factory()->create();
    }

    private function publishedManuscript(User $author, string $briefContent, ?string $rawContent = null, array $overrides = []): Manuscript
    {
        Storage::fake('local');
        Storage::disk('local')->put(self::BRIEF_PATH, $briefContent);

        if ($rawContent !== null) {
            Storage::disk('local')->put(self::RAW_PATH, $rawContent);
        }

        return Manuscript::create(array_merge([
            'user_id' => $author->id,
            'title' => 'Verification fixture: drug-shortage methods note',
            'abstract' => 'A fixture manuscript used only to verify Witness signing and hash parity.',
            'raw_file_path' => self::RAW_PATH,
            'synthesized_brief_path' => self::BRIEF_PATH,
            'status' => 'published',
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'word_count' => 1200,
            'published_at' => Carbon::parse('2026-10-24 12:00:00', 'UTC'),
        ], $overrides));
    }

    private function service(): AttestationService
    {
        return app(AttestationService::class);
    }

    /**
     * Sign exactly as the service signs, via its own private sign().
     * Used only to build the sample-ID fixture; production issuance
     * always goes through issue()/issueManual().
     */
    private function signWithService(string $publicId, string $type, string $id, string $hash, string $issuedAtIso): string
    {
        $method = (new ReflectionClass(AttestationService::class))->getMethod('sign');
        $method->setAccessible(true);

        return $method->invoke($this->service(), $publicId, $type, $id, $hash, $issuedAtIso);
    }

    public function test_sample_attestation_signature_recomputes_exactly(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $manuscript = $this->publishedManuscript($author, 'brief version one');

        $record = app(RecordService::class)->recordPublication($manuscript, $issuer);

        $attestation = Attestation::create([
            'public_id' => self::SAMPLE_PUBLIC_ID,
            'attestable_type' => Manuscript::class,
            'attestable_id' => $manuscript->id,
            'subject_kind' => 'manuscript',
            'entered_via' => 'pipeline',
            'subject_title' => $manuscript->title,
            'claim' => AttestationService::DEFAULT_CLAIM,
            'evidence_manifest' => ['spinwave_record' => [
                'record_id' => $record->id,
                'version' => $record->version,
                'record_hash' => $record->record_hash,
            ]],
            'subject_hash' => $record->record_hash,
            'signature' => str_repeat('0', 64),
            'verifier_id' => $issuer->id,
            'issuer_name' => 'Glenride',
            'method' => 'editorial_review_v1',
            'status' => 'issued',
            'issued_at' => Carbon::parse('2026-10-24 12:00:00', 'UTC'),
        ]);

        $attestation->refresh();

        $attestation->update(['signature' => $this->signWithService(
            $attestation->public_id,
            (string) $attestation->attestable_type,
            (string) $attestation->attestable_id,
            $attestation->subject_hash,
            $attestation->issued_at->format('c'),
        )]);

        $this->assertMatchesRegularExpression('/^GLR-AT-\d{4}-[A-Z0-9]{6}$/', $attestation->public_id);
        $this->assertTrue($this->service()->verifySignature($attestation->fresh()));

        // Tampering with either the hash or the signature must fail.
        $tamperedHash = $attestation->replicate();
        $tamperedHash->subject_hash = hash('sha256', 'tampered content');
        $this->assertFalse($this->service()->verifySignature($tamperedHash));

        $tamperedSig = $attestation->replicate();
        $tamperedSig->signature = str_repeat('f', 64);
        $this->assertFalse($this->service()->verifySignature($tamperedSig));
    }

    public function test_attestation_hash_matches_spinwave_record_hash(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $brief = 'brief version one';
        $manuscript = $this->publishedManuscript($author, $brief, 'raw version one');

        $record = app(RecordService::class)->recordPublication($manuscript, $issuer);
        $attestation = $this->service()->issue($manuscript, $issuer);

        // The synthesized brief wins over the raw file (documented precedence).
        $this->assertSame(hash('sha256', $brief), $record->record_hash);
        $this->assertSame($record->record_hash, $attestation->subject_hash);
        $this->assertSame($record->record_hash, $this->service()->subjectHash($manuscript));
        $this->assertSame($record->record_hash, $attestation->evidence_manifest['spinwave_record']['record_hash']);
        $this->assertSame(1, $attestation->evidence_manifest['spinwave_record']['version']);
        $this->assertSame('Glenride', $attestation->issuer_name);
        $this->assertSame('issued', $attestation->status);
        $this->assertSame('pipeline', $attestation->entered_via);
        $this->assertTrue($this->service()->verifySignature($attestation));
    }

    public function test_unchanged_republish_and_reissue_are_idempotent(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $manuscript = $this->publishedManuscript($author, 'brief version one');

        $records = app(RecordService::class);
        $first = $records->recordPublication($manuscript, $issuer);
        $second = $records->recordPublication($manuscript, $issuer);

        $this->assertTrue($first->is($second));
        $this->assertSame(1, $second->version);
        $this->assertDatabaseCount('manuscript_records', 1);

        $firstAttestation = $this->service()->issue($manuscript, $issuer);
        $secondAttestation = $this->service()->issue($manuscript, $issuer);

        $this->assertTrue($firstAttestation->is($secondAttestation));
        $this->assertDatabaseCount('attestations', 1);
    }

    public function test_changed_brief_earns_new_record_version_and_new_attestation(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $manuscript = $this->publishedManuscript($author, 'brief version one');

        $records = app(RecordService::class);
        $firstRecord = $records->recordPublication($manuscript, $issuer);
        $firstAttestation = $this->service()->issue($manuscript, $issuer);

        Storage::disk('local')->put(self::BRIEF_PATH, 'brief version two');

        $secondRecord = $records->recordPublication($manuscript, $issuer);

        $this->assertSame(2, $secondRecord->version);
        $this->assertSame(hash('sha256', 'brief version two'), $secondRecord->record_hash);
        $this->assertNotSame($firstAttestation->subject_hash, $secondRecord->record_hash);

        $secondAttestation = $this->service()->issue($manuscript, $issuer);

        $this->assertFalse($firstAttestation->is($secondAttestation));
        $this->assertSame($secondRecord->record_hash, $secondAttestation->subject_hash);
        $this->assertTrue($this->service()->verifySignature($secondAttestation));
        $this->assertSame('issued', $firstAttestation->fresh()->status);
    }

    public function test_issue_rejects_unpublished_manuscript(): void
    {
        $this->expectException(DomainException::class);

        $author = $this->plainUser();
        $manuscript = $this->publishedManuscript($author, 'brief version one', null, ['status' => 'submitted']);

        $this->service()->issue($manuscript, $this->issuer());
    }

    public function test_issue_rejects_manuscript_with_unverified_compliance(): void
    {
        $this->expectException(DomainException::class);

        $author = $this->plainUser();
        $manuscript = $this->publishedManuscript($author, 'brief version one', null, ['compliance_citations_verified' => false]);

        $this->service()->issue($manuscript, $this->issuer());
    }

    public function test_manuscript_record_is_append_only(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $manuscript = $this->publishedManuscript($author, 'brief version one');
        $record = app(RecordService::class)->recordPublication($manuscript, $issuer);

        try {
            $record->update(['record_hash' => str_repeat('0', 64)]);
            $this->fail('Updating a SpinWave record should throw.');
        } catch (LogicException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        try {
            $record->delete();
            $this->fail('Deleting a SpinWave record should throw.');
        } catch (LogicException $e) {
            $this->assertStringContainsString('append-only', $e->getMessage());
        }

        $this->assertDatabaseHas('manuscript_records', ['id' => $record->id]);
    }

    public function test_challenge_flips_issued_to_challenged(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $manuscript = $this->publishedManuscript($author, 'brief version one');
        $attestation = $this->service()->issue($manuscript, $issuer);
        $challenger = $this->plainUser();

        // Grounds under 10 characters are rejected; the record stays issued.
        $this->actingAs($challenger)
            ->post(route('attestations.challenge', $attestation), ['grounds' => 'too short'])
            ->assertSessionHasErrors('grounds');
        $this->assertSame('issued', $attestation->fresh()->status);

        $this->actingAs($challenger)
            ->post(route('attestations.challenge', $attestation), ['grounds' => 'The brief does not match the claim.'])
            ->assertRedirect();

        $this->assertSame('challenged', $attestation->fresh()->status);
        $this->assertDatabaseHas('attestation_challenges', [
            'attestation_id' => $attestation->id,
            'challenger_id' => $challenger->id,
            'grounds' => 'The brief does not match the claim.',
            'status' => 'open',
        ]);
    }

    public function test_revoke_requires_issuer_and_keeps_record_visible(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $manuscript = $this->publishedManuscript($author, 'brief version one');
        $attestation = $this->service()->issue($manuscript, $issuer);
        $plain = $this->plainUser();

        $this->actingAs($plain)
            ->post(route('attestations.revoke', $attestation), ['reason' => 'Withdrawn.'])
            ->assertForbidden();

        $this->actingAs($issuer)
            ->post(route('attestations.revoke', $attestation), ['reason' => 'Withdrawn by Glenride.'])
            ->assertRedirect();

        $attestation->refresh();
        $this->assertSame('revoked', $attestation->status);
        $this->assertNotNull($attestation->revoked_at);
        $this->assertSame('Withdrawn by Glenride.', $attestation->revocation_reason);
        $this->assertDatabaseHas('attestations', ['id' => $attestation->id, 'status' => 'revoked']);

        // A revoked record cannot be revoked again or challenged.
        $this->actingAs($issuer)
            ->post(route('attestations.revoke', $attestation), ['reason' => 'Again.'])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->actingAs($plain)
            ->post(route('attestations.challenge', $attestation), ['grounds' => 'Challenging a revoked record.'])
            ->assertRedirect()
            ->assertSessionHas('error');
        $this->assertDatabaseCount('attestation_challenges', 0);
    }

    public function test_issue_route_rejects_non_issuers(): void
    {
        $author = $this->plainUser();
        $manuscript = $this->publishedManuscript($author, 'brief version one');

        $this->actingAs($this->plainUser())
            ->post(route('attestations.store', $manuscript), [])
            ->assertForbidden();
        $this->assertDatabaseCount('attestations', 0);

        $this->actingAs($this->issuer())
            ->post(route('attestations.store', $manuscript), [])
            ->assertRedirect();
        $this->assertDatabaseCount('attestations', 1);
        $this->assertTrue($this->service()->verifySignature(Attestation::first()));
    }

    public function test_manual_standalone_entry_with_hash_override(): void
    {
        $issuer = $this->issuer();
        $override = strtoupper(hash('sha256', 'standalone subject'));

        $payload = [
            'subject_title' => 'Weekly drug-shortage digest, October 19',
            'claim' => 'Glenride attests this digest matches the ASHP and FDA listings retrieved that week.',
            'subject_kind' => 'report',
            'evidence_notes' => 'ASHP and FDA public listings.',
            'evidence_urls' => ['https://example.com/evidence'],
            'subject_hash_override' => $override,
        ];

        $this->actingAs($this->plainUser())
            ->post(route('attestations.storeManual'), $payload)
            ->assertForbidden();

        $this->actingAs($issuer)
            ->post(route('attestations.storeManual'), $payload)
            ->assertRedirect();

        $attestation = Attestation::first();
        $this->assertNull($attestation->attestable_type);
        $this->assertNull($attestation->attestable_id);
        $this->assertSame('manual', $attestation->entered_via);
        $this->assertSame('manual_entry_v1', $attestation->method);
        $this->assertSame(strtolower($override), $attestation->subject_hash);
        $this->assertTrue($this->service()->verifySignature($attestation));

        // Same override re-issued through the service returns the same record.
        $again = $this->service()->issueManual($payload, $issuer);
        $this->assertTrue($attestation->is($again));

        // A malformed override is rejected.
        $this->actingAs($issuer)
            ->post(route('attestations.storeManual'), array_merge($payload, [
                'subject_title' => 'A different subject',
                'subject_hash_override' => 'not-a-sha256-value',
            ]))
            ->assertSessionHasErrors('subject_hash_override');
    }

    public function test_anchor_recording_stores_tx_contract_and_chain(): void
    {
        $author = $this->plainUser();
        $issuer = $this->issuer();
        $manuscript = $this->publishedManuscript($author, 'brief version one');
        $attestation = $this->service()->issue($manuscript, $issuer);

        $tx = '0x'.str_repeat('a', 64);
        $contract = '0x'.str_repeat('b', 40);

        $this->actingAs($this->plainUser())
            ->post(route('attestations.recordAnchor', $attestation), ['tx' => $tx, 'contract' => $contract])
            ->assertForbidden();

        $this->actingAs($issuer)
            ->post(route('attestations.recordAnchor', $attestation), [
                'tx' => $tx,
                'contract' => $contract,
                'chain' => 'base-sepolia',
                'platform' => 'pearls',
            ])
            ->assertRedirect();

        $attestation->refresh();
        $this->assertTrue($attestation->isAnchored());
        $this->assertSame($tx, $attestation->anchor_tx);
        $this->assertSame($contract, $attestation->anchor_contract);
        $this->assertSame('base-sepolia', $attestation->anchor_chain);
        $this->assertSame('pearls', $attestation->anchor_platform);
        $this->assertNotNull($attestation->anchored_at);

        // Defaults: base chain, pearls platform.
        $second = $this->service()->issueManual([
            'subject_title' => 'Second standalone subject',
            'claim' => 'A second claim for anchor defaults.',
            'subject_kind' => 'other',
        ], $issuer);

        $this->actingAs($issuer)
            ->post(route('attestations.recordAnchor', $second), [
                'tx' => '0x'.str_repeat('c', 64),
                'contract' => $contract,
            ])
            ->assertRedirect();

        $second->refresh();
        $this->assertSame('base', $second->anchor_chain);
        $this->assertSame('pearls', $second->anchor_platform);

        // A malformed tx hash is rejected.
        $this->actingAs($issuer)
            ->post(route('attestations.recordAnchor', $second), ['tx' => 'not-a-hash', 'contract' => $contract])
            ->assertSessionHasErrors('tx');
    }

    public function test_public_registry_verify_and_show_routes(): void
    {
        $this->get(route('attestations.index'))->assertOk();

        $author = $this->plainUser();
        $manuscript = $this->publishedManuscript($author, 'brief version one');
        $attestation = $this->service()->issue($manuscript, $this->issuer());

        $this->get(route('attestations.index'))->assertOk();

        $this->post(route('attestations.verify'), ['code' => $attestation->public_id])
            ->assertRedirect(route('attestations.show', $attestation->public_id));

        $this->post(route('attestations.verify'), ['code' => $attestation->subject_hash])
            ->assertRedirect(route('attestations.show', $attestation->public_id));

        $this->post(route('attestations.verify'), ['code' => 'GLR-AT-2026-NOPE01'])
            ->assertSessionHasErrors('code');

        $this->get(route('attestations.show', $attestation->public_id))->assertOk();
        $this->get(route('attestations.show', 'GLR-AT-2026-NOPE01'))->assertNotFound();
    }

    public function test_manual_entry_page_requires_issuer(): void
    {
        $this->get(route('attestations.create'))->assertRedirect();

        $this->actingAs($this->plainUser())
            ->get(route('attestations.create'))
            ->assertForbidden();

        $this->actingAs($this->issuer())
            ->get(route('attestations.create'))
            ->assertOk();
    }
}
