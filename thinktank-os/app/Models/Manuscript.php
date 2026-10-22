<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Manuscript extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'abstract',
        'raw_file_path',
        'synthesized_brief_path',
        'status',
        'compliance_ethics_verified',
        'compliance_transparency_verified',
        'compliance_citations_verified',
        'word_count',
        'grant_amount',
        'published_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'compliance_ethics_verified' => 'boolean',
            'compliance_transparency_verified' => 'boolean',
            'compliance_citations_verified' => 'boolean',
            'grant_amount' => 'decimal:2',
            'word_count' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    /**
     * Scholar/Author who submitted the manuscript.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope query to only published policy briefs.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope query to manuscripts awaiting AI synthesis.
     */
    public function scopePendingSynthesis(Builder $query): Builder
    {
        return $query->where('status', 'submitted');
    }

    /**
     * Check if all compliance checklists are verified.
     */
    public function isComplianceVerified(): bool
    {
        return $this->compliance_ethics_verified
            && $this->compliance_transparency_verified
            && $this->compliance_citations_verified;
    }

    /**
     * SpinWave records: the append-only publish-time snapshots of this
     * manuscript, oldest version first.
     */
    public function records(): HasMany
    {
        return $this->hasMany(ManuscriptRecord::class)->orderBy('version');
    }

    /**
     * The latest SpinWave record (highest version), if any.
     */
    public function latestRecord(): HasOne
    {
        return $this->hasOne(ManuscriptRecord::class)->latestOfMany('version');
    }

    /**
     * Attestations issued for this manuscript.
     */
    public function attestations(): MorphMany
    {
        return $this->morphMany(Attestation::class, 'attestable');
    }

    /**
     * The most recent attestation for this manuscript, if any.
     */
    public function latestAttestation(): ?Attestation
    {
        return $this->attestations()->latest('issued_at')->first();
    }

    /**
     * The current in-force attestation (issued or challenged), if any.
     */
    public function activeAttestation(): ?Attestation
    {
        return $this->attestations()
            ->whereIn('status', ['issued', 'challenged'])
            ->latest('issued_at')
            ->first();
    }

    /**
     * Whether this manuscript carries an attestation in good standing.
     */
    public function isAttested(): bool
    {
        return $this->attestations()->where('status', 'issued')->exists();
    }
}
