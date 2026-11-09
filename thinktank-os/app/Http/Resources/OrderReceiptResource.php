<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderReceiptResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Enforces least-privilege data minimization by exposing only safe receipt attributes.
     * Internal identifiers, payment secrets, and private attendee notes are strictly omitted.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'product_type' => $this->product_type,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_company' => $this->customer_company,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'metadata' => [
                'product_name' => $this->metadata['product_name'] ?? null,
                'product_category' => $this->metadata['product_category'] ?? null,
            ],
            'paid_at' => $this->paid_at?->toIso8601String(),
        ];
    }
}
