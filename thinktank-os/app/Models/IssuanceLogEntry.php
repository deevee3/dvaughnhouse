<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LogicException;

class IssuanceLogEntry extends Model
{
    protected $table = 'attestation_issuance_log';

    /**
     * One entry in the append-only attestation issuance log.
     *
     * Entries are never updated or deleted: revocation is a status on the
     * attestation record, never an erasure of the issuance log. See
     * ATTESTATION-PROTOCOL.md §10 and §20 (log protection).
     *
     * Enforcement is two layers: this model refuses Eloquent updates and
     * deletes, and a database trigger refuses UPDATE/DELETE statements
     * on the table itself (Postgres; see the federal-alignment
     * migration). Query-builder writes in tests simulate tampering and
     * are detected by chain verification, not by these guards.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'seq',
        'prev_hash',
        'public_id',
        'subject_hash',
        'gates_passed',
        'issued_at',
        'human_principal',
        'authorization',
        'entry_hash',
    ];

    protected function casts(): array
    {
        return [
            'seq' => 'integer',
            'gates_passed' => 'array',
            'issued_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Creation is the only write path. Any attempt to save changes
        // to an existing entry is refused: history is never rewritten.
        static::saving(function (self $entry) {
            if ($entry->exists) {
                throw new LogicException('Issuance log entries are append-only and immutable: an existing entry cannot be updated.');
            }
        });

        static::deleting(function () {
            throw new LogicException('Issuance log entries are append-only: an entry cannot be deleted.');
        });
    }

    public function delete()
    {
        throw new LogicException('Issuance log entries are append-only: an entry cannot be deleted.');
    }
}
