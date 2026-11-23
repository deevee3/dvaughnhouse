<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class WorkosCallbackStateTest extends TestCase
{
    use RefreshDatabase;

    private function workosConfig(): void
    {
        config([
            'services.workos.client_id' => 'client_test',
            'services.workos.client_secret' => 'secret_test',
            'services.workos.redirect_uri' => 'https://tc.dvaughnhouse.com/auth/callback',
            'services.workos.owner_emails' => 'dvaughn@dvaughnhouse.com',
        ]);
        Http::fake([
            'api.workos.com/user_management/authenticate' => Http::response([
                'user' => [
                    'email' => 'dvaughn@dvaughnhouse.com',
                    'first_name' => 'D',
                    'last_name' => 'Vaughn',
                ],
            ], 200),
        ]);
    }

    /**
     * Build a state exactly the way login() does, and store it in the
     * cache for a host — the path a callback takes when the session
     * did not survive the WorkOS round trip.
     */
    private function cacheState(string $host): string
    {
        $nonce = (string) Str::uuid();
        $state = $nonce.'.'.hash_hmac('sha256', $nonce, config('app.key'));
        Cache::put('workos_state:'.$state, ['host' => $host, 'at' => time()], 600);

        return $state;
    }

    /**
     * The login must send the redirect URI the WorkOS dashboard has
     * registered: https://*.dvaughnhouse.com/auth/callback (his words,
     * Nov 20). Sending /auth/workos/callback failed every sign-in with
     * redirect-uri-invalid on all four surfaces. The new /auth/callback
     * route must complete the same code exchange as the old path.
     */
    public function test_login_sends_auth_callback_redirect_uri(): void
    {
        $this->workosConfig();

        $response = $this->get('http://tc.dvaughnhouse.com/auth/workos/login');
        $response->assertStatus(302);
        $location = (string) $response->headers->get('Location');
        $this->assertStringContainsString(
            'redirect_uri='.urlencode('https://tc.dvaughnhouse.com/auth/callback'),
            $location
        );
        $states = session('workos_states');
        $this->assertCount(1, $states);

        $response = $this->get(
            'http://tc.dvaughnhouse.com/auth/callback?code=test-code&state='.urlencode($states[0]['state'])
        );
        $response->assertStatus(302);
        $this->assertAuthenticated();
    }

    /**
     * A double-tap on sign-in must not break the first sign-in: the
     * callback for the first state still validates after a second
     * login stored a second state. Regression test for the Nov 20
     * invalid_state pair (two callbacks, both rejected) and Oct 28.
     */
    public function test_callback_accepts_first_state_after_double_login(): void
    {
        $this->workosConfig();

        $this->get('http://tc.dvaughnhouse.com/auth/workos/login')->assertStatus(302);
        $states = session('workos_states');
        $this->assertCount(1, $states);
        $firstState = $states[0]['state'];

        $this->get('http://tc.dvaughnhouse.com/auth/workos/login')->assertStatus(302);
        $this->assertCount(2, session('workos_states'));

        $response = $this->get(
            'http://tc.dvaughnhouse.com/auth/workos/callback?code=test-code&state='.urlencode($firstState)
        );
        $response->assertStatus(302);
        $this->assertAuthenticated();
        $this->assertCount(1, session('workos_states'));
    }

    /**
     * A replayed callback for an already-used state is rejected.
     */
    public function test_callback_rejects_replayed_state(): void
    {
        $this->workosConfig();

        $this->get('http://tc.dvaughnhouse.com/auth/workos/login')->assertStatus(302);
        $state = session('workos_states')[0]['state'];

        $this->get(
            'http://tc.dvaughnhouse.com/auth/workos/callback?code=test-code&state='.urlencode($state)
        )->assertStatus(302);
        $this->assertAuthenticated();

        auth()->logout();
        $this->assertGuest();

        $this->get(
            'http://tc.dvaughnhouse.com/auth/workos/callback?code=test-code&state='.urlencode($state)
        )->assertRedirect('/');
        $this->assertGuest();
    }

    /**
     * The session is gone (iPhone browser handoff: the callback lands
     * in a different browser view than the login started in), but the
     * state is in the cache for this host. The callback must accept
     * it. Regression test for the Nov 20 17:46 ET failures: three
     * invalid_state callbacks in 26 seconds, session never surviving.
     */
    public function test_callback_accepts_cached_state_without_session(): void
    {
        $this->workosConfig();
        $state = $this->cacheState('tc.dvaughnhouse.com');

        $this->assertGuest();
        $this->assertNull(session('workos_states'));

        $this->get(
            'http://tc.dvaughnhouse.com/auth/workos/callback?code=test-code&state='.urlencode($state)
        )->assertStatus(302);
        $this->assertAuthenticated();
        $this->assertNull(Cache::get('workos_state:'.$state));
    }

    /**
     * A cached state is single-use: replaying the callback is rejected.
     */
    public function test_callback_rejects_replayed_cached_state(): void
    {
        $this->workosConfig();
        $state = $this->cacheState('tc.dvaughnhouse.com');

        $this->get(
            'http://tc.dvaughnhouse.com/auth/workos/callback?code=test-code&state='.urlencode($state)
        )->assertStatus(302);
        $this->assertAuthenticated();

        auth()->logout();
        $this->assertGuest();

        $this->get(
            'http://tc.dvaughnhouse.com/auth/workos/callback?code=test-code&state='.urlencode($state)
        )->assertRedirect('/');
        $this->assertGuest();
    }

    /**
     * A cached state issued for another host does not validate here.
     */
    public function test_callback_rejects_cached_state_for_other_host(): void
    {
        $this->workosConfig();
        $state = $this->cacheState('trade.dvaughnhouse.com');

        $this->get(
            'http://tc.dvaughnhouse.com/auth/workos/callback?code=test-code&state='.urlencode($state)
        )->assertRedirect('/');
        $this->assertGuest();
    }
}
