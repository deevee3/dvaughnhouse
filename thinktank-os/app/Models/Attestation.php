<?php

namespace App\Models;

use App\Services\Attestation\AttestationStatement;
use App\Services\Attestation\SigningKeyService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A Glenride attestation: a signed record of identity, origin,
 * integrity, and the stated claim for one record.
 *
 * What "attested" means: the attestation certifies the identity,
 * origin, and integrity of the record, plus the claim stated below,
 * as published. It does NOT certify the truth of third-party data the
 * record reports. It is NOT a federal certification, and no federal
 * agency has endorsed it. See ATTESTATION-PROTOCOL.md §22.
 *
 * Signing methods: records issued from November 17, 2026 sign with
 * Ed25519 (FIPS 186-5) under a published key ID and verify from the
 * published public key. Records issued before then sign with HMAC
 * and verify through the legacy path. Verification is dual: each
 * record is verified by the method recorded on it. Old records are
 * never re-signed.
 *
 * Corrections never overwrite: a correction appends a new version
 * (version N+1) linked to the original by supersedes_id; the original
 * stays readable and is marked superseded. See protocol §21.
 */
class Attestation extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'public_id',
        'attestable_type',
        'attestable_id',
        'subject_kind',
        'entered_via',
        'subject_title',
        'claim',
        'evidence_manifest',
        'subject_hash',
        'signature',
        'signature_method',
        'key_id',
        'timestamp_token',
        'timestamped_at',
        'timestamp_source',
        'timestamp_status',
        'authorization_evidence',
        'verifier_id',
        'issuer_name',
        'method',
        'status',
        'issued_at',
        'anchor_platform',
        'anchor_chain',
        'anchor_contract',
        'anchor_tx',
        'anchored_at',
        'revoked_at',
        'revocation_reason',
        'supersedes_id',
        'version',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'evidence_manifest' => 'array',
            'issued_at' => 'datetime',
            'anchored_at' => 'datetime',
            'revoked_at' => 'datetime',
            'timestamped_at' => 'datetime',
            'version' => 'integer',
        ];
    }

    /**
     * The attestation statement that accompanies this record, rendered
     * deterministically from its stored fields. Display-only: rendering
     * never changes any stored field or signed byte.
     */
    public function statement(): string
    {
        return AttestationStatement::render($this);
    }

    /**
     * The signature block shown below the statement: printed name, role,
     * date/time, signature value, key ID, timestamp.
     *
     * @return array{printed_name: string, role: string, date_time: string, signature_value: string, signature_method: string, key_id: string, timestamp: string}
     */
    public function signatureBlock(): array
    {
        return AttestationStatement::signatureBlock($this);
    }

    /**
     * The issuance log entry for this attestation, if one exists.
     */
    public function issuanceLogEntry(): HasOne
    {
        return $this->hasOne(IssuanceLogEntry::class, 'public_id', 'public_id');
    }

    /**
     * The attestation this record corrects, if it is a correction.
     */
    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supersedes_id');
    }

    /**
     * The correction that superseded this record, if one exists.
     */
    public function supersededBy(): HasOne
    {
        return $this->hasOne(self::class, 'supersedes_id');
    }

    public function isSuperseded(): bool
    {
        return $this->supersededBy()->exists();
    }

    public function isEd25519(): bool
    {
        return ($this->signature_method ?: SigningKeyService::METHOD_HMAC) === SigningKeyService::METHOD_ED25519;
    }

    /**
     * The work this attestation covers.
     */
    public function attestable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * The user who verified the work and issued this attestation.
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verifier_id');
    }

    /**
     * Challenges raised against this attestation.
     */
    public function challenges(): HasMany
    {
        return $this->hasMany(AttestationChallenge::class);
    }

    /**
     * Scope query to attestations that are still in force.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', ['issued', 'challenged']);
    }

    /**
     * Whether this attestation is still in force (issued or challenged).
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['issued', 'challenged'], true);
    }

    /**
     * Whether this attestation has been anchored on-chain.
     * Anchoring is tentative in v1 — these fields stay null until issuance.
     */
    public function isAnchored(): bool
    {
        return ! empty($this->anchor_tx);
    }

    /**
     * Short, human-readable fingerprint of the signature.
     */
    public function signatureFingerprint(): string
    {
        $head = strtoupper(substr((string) $this->signature, 0, 16));

        return implode(' ', str_split($head, 4));
    }
}
