<?php

namespace Tests\Feature;

use App\Models\Attestation;
use App\Models\IssuanceLogEntry;
use App\Models\User;
use App\Services\Attestation\DigestAttestationEmail;
use App\Services\Attestation\DigestAttestationService;
use App\Services\Attestation\IssuanceChainService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DigestAttestationTest extends TestCase
{
    use RefreshDatabase;

    private User $orchestrator;

    private string $contents;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Http::fake();

        $this->orchestrator = User::factory()->create(['role' => 'orchestrator']);
        $this->contents = "# Glenride Weekly Drug Shortage Digest — October 19, 2026\n\nASHP 192, FDA 69 of 74.\n";
    }

    private function queueRow(array $overrides = []): array
    {
        Storage::disk('local')->put(
            'digest-attestation/files/digest-2026-10-19.md',
            $this->contents
        );

        $row = array_merge([
            'edition_date' => '2026-10-19',
            'subject_title' => 'Glenride Weekly Drug Shortage Digest — October 19, 2026',
            'published_title' => 'Glenride Weekly Drug Shortage Digest — October 19, 2026',
            'subject_kind' => 'report',
            'digest_run' => [
                'ashp' => 192,
                'fda_in_shortage' => 69,
                'fda_total' => 74,
                'retrieved_on' => '2026-10-19',
            ],
            'canonical_file' => 'digest-attestation/files/digest-2026-10-19.md',
            'subject_hash' => hash('sha256', $this->contents),
            'public_url' => 'https://blog.dvaughnhouse.com/glenride-weekly-drug-shortage-digest-october-19-2026/',
            'is_public' => true,
            'released' => true,
            'release_note' => 'Published to the Dispatch.',
            'evidence_notes' => 'Test evidence.',
        ], $overrides);

        Storage::disk('local')->put(
            'digest-attestation/queue/2026-10-19.json',
            json_encode($row)
        );

        return $row;
    }

    private function service(): DigestAttestationService
    {
        return app(DigestAttestationService::class);
    }

    public function test_gates_pass_and_the_digest_is_issued_with_a_chain_entry(): void
    {
        $row = $this->queueRow();

        $outcome = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('issued', $outcome['outcome']);
        $this->assertSame([1, 2, 3, 4, 5, 6], $outcome['gates_passed']);
        $this->assertSame(
            'Glenride\'s weekly drug-shortage digest for October 19, 2026: ASHP tracked 192 live shortage bulletins and the FDA listed 69 of 74 database entries in shortage, retrieved and verified on October 19, 2026.',
            $outcome['claim']
        );

        $attestation = Attestation::first();
        $this->assertNotNull($attestation);
        $this->assertSame('automated', $attestation->entered_via);
        $this->assertSame('report', $attestation->subject_kind);
        $this->assertSame('automated_digest_v1', $attestation->method);
        $this->assertSame('Glenride', $attestation->issuer_name);
        $this->assertSame($this->orchestrator->id, $attestation->verifier_id);

        // Human source: the record names the principal and the authorization.
        $this->assertSame(IssuanceChainService::HUMAN_PRINCIPAL, $attestation->evidence_manifest['human_principal']);
        $this->assertSame(IssuanceChainService::AUTHORIZATION, $attestation->evidence_manifest['authorization']);

        // Chain: genesis (seq 0) + one issuance (seq 1), gap-free.
        $this->assertSame(2, IssuanceLogEntry::count());
        $entry = IssuanceLogEntry::where('seq', 1)->first();
        $this->assertSame($attestation->public_id, $entry->public_id);
        $this->assertSame(IssuanceChainService::HUMAN_PRINCIPAL, $entry->human_principal);
        $this->assertTrue(app(IssuanceChainService::class)->verify()['valid']);
    }

    public function test_gate_1_holds_an_unreleased_digest(): void
    {
        $row = $this->queueRow(['released' => false]);

        $outcome = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('held', $outcome['outcome']);
        $this->assertSame(1, $outcome['failed_gate']);
        $this->assertSame(0, Attestation::count());
        $this->assertSame(0, IssuanceLogEntry::count());
    }

    public function test_gate_2_holds_when_the_public_url_does_not_return_200(): void
    {
        // Restore the real HTTP client and point at a refused loopback
        // port: the probe gets a transport failure (status 0), so gate 2
        // must fail. (Re-faking over the setUp fake does not reliably
        // replace it; the real client + refused connection is exact.)
        Http::swap(new \Illuminate\Http\Client\Factory);
        $row = $this->queueRow(['public_url' => 'http://127.0.0.1:9/unreachable']);

        $outcome = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('held', $outcome['outcome']);
        $this->assertSame(2, $outcome['failed_gate']);
        $this->assertSame(0, Attestation::count());
    }

    public function test_gate_2_is_satisfied_by_file_plus_hash_for_a_paid_artifact(): void
    {
        Http::fake(fn () => Http::response(null, 404));
        $row = $this->queueRow(['is_public' => false, 'public_url' => null]);

        $outcome = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('issued', $outcome['outcome']);
    }

    public function test_gate_3_holds_on_hash_mismatch(): void
    {
        $row = $this->queueRow(['subject_hash' => hash('sha256', 'different contents')]);

        $outcome = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('held', $outcome['outcome']);
        $this->assertSame(3, $outcome['failed_gate']);
        $this->assertSame(0, Attestation::count());
    }

    public function test_gate_4_holds_when_the_recorded_claim_does_not_match_the_built_claim(): void
    {
        $row = $this->queueRow(['claim' => 'Glenride\'s weekly drug-shortage digest for October 19, 2026: ASHP tracked 999 live shortage bulletins and the FDA listed 69 of 74 database entries in shortage, retrieved and verified on October 19, 2026.']);

        $outcome = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('held', $outcome['outcome']);
        $this->assertSame(4, $outcome['failed_gate']);
        $this->assertSame(0, Attestation::count());
    }

    public function test_gate_5_holds_when_the_published_title_differs(): void
    {
        $row = $this->queueRow(['published_title' => 'A different title']);

        $outcome = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('held', $outcome['outcome']);
        $this->assertSame(5, $outcome['failed_gate']);
        $this->assertSame(0, Attestation::count());
    }

    public function test_duplicate_trigger_is_a_noop_with_no_new_sequence_number(): void
    {
        $row = $this->queueRow();

        $first = $this->service()->processRow($row, $this->orchestrator);
        $second = $this->service()->processRow($row, $this->orchestrator);

        $this->assertSame('issued', $first['outcome']);
        $this->assertSame('duplicate', $second['outcome']);
        $this->assertSame($first['public_id'], $second['public_id']);
        $this->assertSame(1, Attestation::count());
        $this->assertSame(2, IssuanceLogEntry::count()); // genesis + one issuance
        $this->assertTrue(app(IssuanceChainService::class)->verify()['valid']);
    }

    public function test_three_consecutive_failures_wait_on_a_human_and_force_rechecks(): void
    {
        $row = $this->queueRow(['released' => false]);
        $service = $this->service();

        $this->assertSame('held', $service->processRow($row, $this->orchestrator)['outcome']);
        $this->assertSame('held', $service->processRow($row, $this->orchestrator)['outcome']);
        $third = $service->processRow($row, $this->orchestrator);
        $this->assertSame('held', $third['outcome']);
        $this->assertSame(3, $third['consecutive_failures']);
        $this->assertTrue($third['waiting_on_human']);

        $fourth = $service->processRow($row, $this->orchestrator);
        $this->assertSame('waiting', $fourth['outcome']);

        // --force re-runs the gates instead of waiting.
        $forced = $service->processRow($row, $this->orchestrator, true);
        $this->assertSame('held', $forced['outcome']);
        $this->assertSame(0, Attestation::count());
        $this->assertSame(0, IssuanceLogEntry::count());
    }

    public function test_chain_verify_detects_a_tampered_entry(): void
    {
        $this->queueRow();
        $this->service()->processRow($this->queueRow(), $this->orchestrator);
        $this->assertTrue(app(IssuanceChainService::class)->verify()['valid']);

        IssuanceLogEntry::where('seq', 1)->update(['subject_hash' => str_repeat('0', 64)]);

        $result = app(IssuanceChainService::class)->verify();
        $this->assertFalse($result['valid']);
        $this->assertNotEmpty($result['errors']);
    }

    public function test_chain_verify_detects_a_gap(): void
    {
        $row = $this->queueRow();
        $this->service()->processRow($row, $this->orchestrator);

        $secondContents = "# Second digest\n";
        Storage::disk('local')->put('digest-attestation/files/digest-2026-10-26.md', $secondContents);
        $row2 = $row;
        $row2['edition_date'] = '2026-10-26';
        $row2['subject_title'] = 'Glenride Weekly Drug Shortage Digest — October 26, 2026';
        $row2['published_title'] = $row2['subject_title'];
        $row2['canonical_file'] = 'digest-attestation/files/digest-2026-10-26.md';
        $row2['subject_hash'] = hash('sha256', $secondContents);
        $this->service()->processRow($row2, $this->orchestrator);

        $this->assertTrue(app(IssuanceChainService::class)->verify()['valid']);

        IssuanceLogEntry::where('seq', 1)->delete();

        $result = app(IssuanceChainService::class)->verify();
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('gap', implode(' ', $result['errors']));
    }

    public function test_mixed_issue_hold_duplicate_runs_leave_no_gaps(): void
    {
        $service = $this->service();

        $good = $this->queueRow();
        $this->assertSame('issued', $service->processRow($good, $this->orchestrator)['outcome']);

        // A genuinely different edition (different file + hash) that is
        // not released: held, not a duplicate of the issued edition.
        $heldContents = "# Glenride Weekly Drug Shortage Digest — November 2, 2026\n";
        Storage::disk('local')->put('digest-attestation/files/digest-2026-11-02.md', $heldContents);
        $heldRow = $good;
        $heldRow['edition_date'] = '2026-11-02';
        $heldRow['subject_title'] = 'Glenride Weekly Drug Shortage Digest — November 2, 2026';
        $heldRow['published_title'] = $heldRow['subject_title'];
        $heldRow['canonical_file'] = 'digest-attestation/files/digest-2026-11-02.md';
        $heldRow['subject_hash'] = hash('sha256', $heldContents);
        $heldRow['released'] = false;
        $heldRow['release_note'] = 'Not released.';
        $this->assertSame('held', $service->processRow($heldRow, $this->orchestrator)['outcome']);

        $this->assertSame('duplicate', $service->processRow($good, $this->orchestrator)['outcome']);

        $result = app(IssuanceChainService::class)->verify();
        $this->assertTrue($result['valid']);
        $this->assertSame([0, 1], IssuanceLogEntry::orderBy('seq')->pluck('seq')->all());
    }

    public function test_the_button_path_shares_the_gates_with_the_automatic_path(): void
    {
        // A gate failure blocks the button exactly as it blocks the command.
        $this->queueRow(['released' => false]);

        $response = $this->actingAs($this->orchestrator)
            ->post(route('attestations.attestDigest', '2026-10-19'));

        $response->assertSessionHas('error');
        $this->assertSame(0, Attestation::count());

        // And a passing row issues through the button.
        $this->queueRow();

        $response = $this->actingAs($this->orchestrator)
            ->post(route('attestations.attestDigest', '2026-10-19'));

        $attestation = Attestation::first();
        $this->assertNotNull($attestation);
        $response->assertRedirect(route('attestations.show', $attestation->public_id));
        $this->assertSame('automated', $attestation->entered_via);
    }

    public function test_the_queue_page_is_issuer_only(): void
    {
        $this->queueRow();

        // Guest first: actingAs() persists within a test, so the guest
        // check must run before any authenticated request.
        $this->get(route('attestations.digestQueue'))
            ->assertRedirect(route('login'));

        $this->actingAs($this->orchestrator)
            ->get(route('attestations.digestQueue'))
            ->assertOk();

        $this->actingAs(User::factory()->create())
            ->get(route('attestations.digestQueue'))
            ->assertForbidden();
    }

    public function test_the_email_builder_reports_issued_and_held_runs(): void
    {
        $payload = DigestAttestationEmail::forRun([
            [
                'outcome' => 'issued',
                'edition_date' => '2026-10-19',
                'subject_title' => 'Glenride Weekly Drug Shortage Digest — October 19, 2026',
                'public_id' => 'GLR-AT-2026-TEST01',
                'subject_hash' => str_repeat('a', 64),
                'claim' => 'A claim.',
                'figures' => ['ashp' => 192, 'fda_in_shortage' => 69, 'fda_total' => 74, 'retrieved_on' => '2026-10-19'],
                'gates_passed' => [1, 2, 3, 4, 5, 6],
            ],
            [
                'outcome' => 'held',
                'edition_date' => '2026-10-26',
                'subject_title' => 'Weekly Drug-Shortage Digest: U.S. Shortage Activity, Week of October 12–19, 2026',
                'failed_gate' => 3,
                'reason' => 'Hash mismatch.',
                'consecutive_failures' => 1,
            ],
        ], '2026-11-17T10:00:00-05:00', 'https://thinktank.example');

        $this->assertSame('dvaughnhouse@gmail.com', $payload['to']);
        $this->assertStringContainsString('URGENT', $payload['subject']);
        $this->assertStringContainsString('GLR-AT-2026-TEST01', $payload['body']);
        $this->assertStringContainsString('Gates passed: 1, 2, 3, 4, 5, 6', $payload['body']);
        $this->assertStringContainsString('Human principal', $payload['body']);
        $this->assertStringContainsString('gate 3', $payload['subject']);
        $this->assertStringContainsString('Failed gate: 3', $payload['body']);
        $this->assertStringContainsString('https://thinktank.example/attestations', $payload['body']);
    }

    public function test_the_command_issues_and_the_chain_command_verifies(): void
    {
        $this->queueRow();

        $this->artisan('attestations:digest', ['--no-email' => true])
            ->assertExitCode(0);
        $this->assertSame(1, Attestation::count());

        $this->artisan('attestations:verify-chain')
            ->expectsOutputToContain('VALID')
            ->assertExitCode(0);
    }
}
