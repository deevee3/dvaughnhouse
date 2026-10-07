<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_number',
        'product_type',
        'customer_name',
        'customer_email',
        'customer_company',
        'amount',
        'currency',
        'status',
        'stripe_payment_intent_id',
        'stripe_customer_id',
        'metadata',
        'paid_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'metadata' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * Scope for successful orders.
     */
    public function scopeSucceeded($query)
    {
        return $query->where('status', 'succeeded');
    }
}
