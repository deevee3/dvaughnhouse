<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

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
        'subject_title',
        'claim',
        'evidence_manifest',
        'subject_hash',
        'signature',
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
        ];
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
