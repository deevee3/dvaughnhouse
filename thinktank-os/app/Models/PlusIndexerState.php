<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlusIndexerState extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'last_block', 'latest_seen', 'last_run_at'];

    protected $casts = [
        'last_block' => 'integer',
        'latest_seen' => 'integer',
        'last_run_at' => 'datetime',
    ];

    public static function for(string $key): self
    {
        return static::firstOrCreate(['key' => $key], ['last_block' => 0, 'latest_seen' => 0]);
    }
}
