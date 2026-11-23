<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlusSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_subscribe_in_test_mode_creates_a_subscription_and_charges_nothing(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/plus/api/subscribe', ['tier' => 'SAPPHIRE']);
        $response->assertOk();
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('subscription.tier', 'SAPPHIRE');
        $response->assertJsonPath('subscription.provider_mode', 'test');
        $response->assertJsonPath('subscription.price_monthly', 7);

        $this->assertDatabaseHas('plus_subscriptions', [
            'user_id' => $user->id,
            'tier' => 'SAPPHIRE',
            'status' => 'active',
            'provider' => 'test',
        ]);
    }

    public function test_feed_needs_a_pass_and_is_empty_until_the_first_launch(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/plus/api/feed')->assertForbidden();

        $this->actingAs($user)->postJson('/plus/api/subscribe', ['tier' => 'EMERALD'])->assertOk();

        $response = $this->actingAs($user)->getJson('/plus/api/feed');
        $response->assertOk();
        $response->assertJsonPath('launches', []);
        $response->assertJsonPath('source', 'on-chain');
    }

    public function test_cancel_ends_the_subscription(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/plus/api/subscribe', ['tier' => 'RUBY'])->assertOk();

        $response = $this->actingAs($user)->postJson('/plus/api/subscription/cancel');
        $response->assertOk();
        $response->assertJsonPath('subscription', null);

        $this->assertDatabaseHas('plus_subscriptions', [
            'user_id' => $user->id,
            'tier' => 'RUBY',
            'status' => 'cancelled',
        ]);
    }

    public function test_unknown_tier_is_rejected_and_guests_cannot_subscribe(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/plus/api/subscribe', ['tier' => 'DIAMOND'])
            ->assertStatus(422);

        // actingAs persists within a test; log out to become a guest.
        auth()->logout();

        $this->postJson('/plus/api/subscribe', ['tier' => 'SAPPHIRE'])
            ->assertStatus(401);
    }

    public function test_portal_renders_with_a_real_subscription_lookup(): void
    {
        $this->withoutVite();
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/plus/api/subscribe', ['tier' => 'SAPPHIRE'])->assertOk();

        $response = $this->actingAs($user)->get('/staging/plus');
        $response->assertStatus(200);
    }
}
