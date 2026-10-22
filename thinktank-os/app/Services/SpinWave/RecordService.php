<?php

namespace App\Services\SpinWave;

use App\Models\Manuscript;
use App\Models\ManuscriptRecord;
use App\Models\User;
use App\Services\Attestation\AttestationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RecordService
{
    public function __construct(
        private AttestationService $attestations,
    ) {}

    /**
     * Permanently record a publication on SpinWave.
     *
     * Publishing is the act of recording: this snapshots the manuscript's
     * current state into an append-only ManuscriptRecord. The record hash
     * is computed by AttestationService::subjectHash() — the exact same
     * inputs and precedence (synthesized brief file, else raw file, else
     * canonical string) — so a manuscript's record hash equals the
     * subject_hash of any attestation issued against unchanged content.
     *
     * Idempotent on unchanged content: if the latest record already
     * carries the new hash, it is returned and no duplicate version is
     * created. A content change earns the next version number.
     *
     * Concurrent publishes are serialized with a row lock on the
     * manuscript inside a transaction.
     */
    public function recordPublication(Manuscript $manuscript, ?User $recordedBy = null): ManuscriptRecord
    {
        return DB::transaction(function () use ($manuscript, $recordedBy) {
            $locked = Manuscript::whereKey($manuscript->id)
                ->lockForUpdate()
                ->firstOrFail();

            $locked->loadMissing('user:id,name');

            $recordHash = $this->attestations->subjectHash($locked);

            $latest = ManuscriptRecord::where('manuscript_id', $locked->id)
                ->orderByDesc('version')
                ->first();

            if ($latest && $latest->record_hash === $recordHash) {
                return $latest;
            }

            $disk = Storage::disk('local');

            $briefSha256 = null;
            if ($locked->synthesized_brief_path && $disk->exists($locked->synthesized_brief_path)) {
                $briefSha256 = hash('sha256', $disk->get($locked->synthesized_brief_path));
            }

            $snapshot = [
                'title' => $locked->title,
                'abstract' => $locked->abstract,
                'author' => $locked->user?->name,
                'word_count' => $locked->word_count,
                'brief_sha256' => $briefSha256,
                'compliance' => [
                    'ethics' => (bool) $locked->compliance_ethics_verified,
                    'transparency' => (bool) $locked->compliance_transparency_verified,
                    'citations' => (bool) $locked->compliance_citations_verified,
                ],
                'published_at' => $locked->published_at ? $locked->published_at->format('c') : null,
            ];

            return ManuscriptRecord::create([
                'manuscript_id' => $locked->id,
                'version' => ($latest?->version ?? 0) + 1,
                'record_hash' => $recordHash,
                'snapshot' => $snapshot,
                'recorded_by' => $recordedBy?->id,
            ]);
        });
    }
}
