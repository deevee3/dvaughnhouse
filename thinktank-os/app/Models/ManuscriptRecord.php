<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class ManuscriptRecord extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'manuscript_id',
        'version',
        'record_hash',
        'snapshot',
        'recorded_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'version' => 'integer',
        ];
    }

    /**
     * Records are append-only — the SpinWave store of record.
     *
     * Updates are blocked unconditionally: a changed manuscript earns a
     * new record version, never an edit to an existing one. Deletes are
     * blocked while the parent manuscript still exists; when the
     * manuscript itself is deleted, the database-level FK cascade
     * removes its records without firing these events, which is the one
     * sanctioned removal path. An explicit delete of an orphaned record
     * (parent already gone) is allowed through.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new LogicException('SpinWave manuscript records are immutable and cannot be updated.');
        });

        static::deleting(function (ManuscriptRecord $record) {
            if ($record->manuscript()->exists()) {
                throw new LogicException('SpinWave manuscript records are append-only and cannot be deleted.');
            }
        });
    }

    /**
     * The manuscript this record permanently snapshots.
     */
    public function manuscript(): BelongsTo
    {
        return $this->belongsTo(Manuscript::class);
    }

    /**
     * The user whose publish action created this record, if any.
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
