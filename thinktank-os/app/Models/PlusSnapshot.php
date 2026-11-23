<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlusSnapshot extends Model
{
    protected $fillable = [
        'user_id', 'name', 'token_address', 'snapshot_block', 'filters',
        'status', 'holder_count', 'merkle_root', 'holders', 'excluded',
    ];

    protected $casts = [
        'snapshot_block' => 'integer',
        'holder_count' => 'integer',
        'filters' => 'array',
        'holders' => 'array',
        'excluded' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
