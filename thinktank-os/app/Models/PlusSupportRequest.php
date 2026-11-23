<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlusSupportRequest extends Model
{
    protected $fillable = ['user_id', 'subject', 'body', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
