<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditAccount extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'user_id',
        'wallet_address',
        'balance',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    /**
     * The user who owns this budget account, if any.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Ledger entries for this account, oldest first.
     *
     * The account balance column is the read model: it is updated inside
     * the same transaction as every ledger insert by CreditService, and
     * is never recomputed from a sum on read.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class)->orderBy('created_at');
    }

    /**
     * Manuscripts whose attestation debits draw from this account.
     */
    public function manuscripts(): HasMany
    {
        return $this->hasMany(Manuscript::class);
    }
}
