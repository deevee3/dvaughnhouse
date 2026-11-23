<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlusFeedUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $indexed,
        public int $lastBlock,
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('plus-feed');
    }

    public function broadcastAs(): string
    {
        return 'feed.updated';
    }

    public function broadcastWith(): array
    {
        return ['indexed' => $this->indexed, 'last_block' => $this->lastBlock];
    }
}
