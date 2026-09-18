<?php

namespace App\Events;

use App\Models\Manuscript;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ManuscriptStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Manuscript $manuscript)
    {
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('manuscripts.'.$this->manuscript->user_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ManuscriptStatusUpdated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->manuscript->id,
            'title' => $this->manuscript->title,
            'status' => $this->manuscript->status,
            'synthesized_brief_path' => $this->manuscript->synthesized_brief_path,
            'word_count' => $this->manuscript->word_count,
            'updated_at' => $this->manuscript->updated_at?->toISOString(),
        ];
    }
}
