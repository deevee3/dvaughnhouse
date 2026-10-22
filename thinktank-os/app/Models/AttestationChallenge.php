<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttestationChallenge extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'attestation_id',
        'challenger_id',
        'grounds',
        'status',
        'resolution_note',
    ];

    /**
     * The attestation being challenged.
     */
    public function attestation(): BelongsTo
    {
        return $this->belongsTo(Attestation::class);
    }

    /**
     * The user who raised the challenge.
     */
    public function challenger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'challenger_id');
    }
}
