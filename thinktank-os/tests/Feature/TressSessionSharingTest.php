<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * One sign-in covers all four Tress surfaces (Nov 20, 2026, his
 * word: the surfaces "just loop around").
 *
 * The session store is shared, but the session cookie was host-only
 * (SESSION_DOMAIN=null), so signing in on tc left trade/ops/plus
 * signed-out and each demanded its own sign-in. The
 * TressSessionDomain middleware now issues the cookie for
 * .dvaughnhouse.com — only when the request host is under that
 * parent, so staging on dvaughnhouse.org keeps host-only cookies
 * (a browser rejects a Set-Cookie whose Domain does not match the
 * origin host).
 */
class TressSessionSharingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The array session driver (phpunit default) never issues a
        // session cookie, so the cookie-domain assertions below need
        // the database driver and its sessions table (migrated by
        // RefreshDatabase). This is the production driver too.
        config(['session.driver' => 'database']);
    }

    private function sessionCookie(?string $domain = null): string
    {
        if ($domain !== null) {
            config(['session.shared_domain' => $domain]);
        }

        return config('session.cookie');
    }

    private function cookieDomain($response, string $name): mixed
    {
        foreach ($response->baseResponse->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $name) {
                return $cookie->getDomain();
            }
        }

        $this->fail("No '{$name}' cookie was set on the response.");
    }

    private function cookieValue($response, string $name): string
    {
        foreach ($response->baseResponse->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $name) {
                return (string) $cookie->getValue();
            }
        }

        $this->fail("No '{$name}' cookie was set on the response.");
    }

    public function test_session_cookie_is_shared_on_a_tress_host(): void
    {
        $name = $this->sessionCookie('.dvaughnhouse.com');

        $response = $this->get('https://tc.dvaughnhouse.com/auth/tress-entry');
        $response->assertStatus(200);

        $this->assertSame('.dvaughnhouse.com', $this->cookieDomain($response, $name));
    }

    public function test_session_cookie_stays_host_only_on_staging(): void
    {
        $name = $this->sessionCookie('.dvaughnhouse.com');

        $response = $this->get('https://dvaughnhouse.org/auth/tress-entry');
        $response->assertStatus(200);

        $this->assertContains($this->cookieDomain($response, $name), [null, '']);
    }

    public function test_session_cookie_stays_host_only_without_a_shared_domain(): void
    {
        config(['session.shared_domain' => null]);
        $name = config('session.cookie');

        $response = $this->get('https://tc.dvaughnhouse.com/auth/tress-entry');
        $response->assertStatus(200);

        $this->assertContains($this->cookieDomain($response, $name), [null, '']);
    }

    /**
     * Sign in on tc, then carry the same session cookie to trade
     * and ops: both must see the signed-in user, with no second
     * sign-in. The cookie value taken from the callback response is
     * already encrypted (EncryptCookies ran), so it is sent back
     * unencrypted-as-is.
     */
    public function test_sign_in_on_tc_carries_to_trade_and_ops(): void
    {
        $name = $this->sessionCookie('.dvaughnhouse.com');

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

        $response = $this->get('http://tc.dvaughnhouse.com/auth/workos/login');
        $response->assertStatus(302);
        $states = session('workos_states');
        $this->assertCount(1, $states);

        $response = $this->get(
            'http://tc.dvaughnhouse.com/auth/callback?code=test-code&state='.urlencode($states[0]['state'])
        );
        $response->assertStatus(302);
        $this->assertAuthenticated();
        $this->assertSame('.dvaughnhouse.com', $this->cookieDomain($response, $name));
        $cookieValue = $this->cookieValue($response, $name);

        $response = $this->withUnencryptedCookie($name, $cookieValue)
            ->get('https://trade.dvaughnhouse.com/');
        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('TradingTerminal/LoggedIn/Markets')
            ->where('auth.user.email', 'dvaughn@dvaughnhouse.com'));

        $response = $this->withUnencryptedCookie($name, $cookieValue)
            ->get('https://ops.dvaughnhouse.com/');
        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('OpsConsole/LoggedIn/Index')
            ->where('auth.user.email', 'dvaughn@dvaughnhouse.com'));
    }
}
