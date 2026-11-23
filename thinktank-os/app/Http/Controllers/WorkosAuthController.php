<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WorkosAuthController extends Controller
{
    /**
     * WorkOS sign-in for ThinkTank OS (live 2026-10-28, replacing the
     * email+password login). Fresh-login rule: every sign-in is a fresh
     * encounter — prompt=login forces WorkOS to ask again instead of
     * carrying over a session from another site.
     */
    public function login(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $config = config('services.workos');
        if (empty($config['client_id']) || empty($config['client_secret']) || empty($config['redirect_uri'])) {
            return redirect('/');
        }
        // The callback must come back to the host the sign-in started
        // on: the WorkOS state-cache copy is bound to that host, so a
        // shared redirect would strand the state and fail the check
        // in callback(). Sessions themselves are shared across the
        // four surfaces since Nov 20, 2026 (TressSessionDomain sets
        // the cookie domain to .dvaughnhouse.com), so a signed-in
        // user never reaches login() by navigating between surfaces.
        // The redirect URI must match the wildcard registered for this
        // app in the WorkOS dashboard: https://*.dvaughnhouse.com/auth/callback
        // (his words, Nov 20). The old /auth/workos/callback path does not
        // match that wildcard, so WorkOS rejected every sign-in with
        // redirect-uri-invalid on all four surfaces.
        $redirectUri = 'https://'.$request->getHost().'/auth/callback';
        $nonce = (string) Str::uuid();
        $sig = hash_hmac('sha256', $nonce, config('app.key'));
        $state = $nonce.'.'.$sig;
        // Keep recent states, not just the latest: a double-tap (or a
        // browser firing the callback twice) used to overwrite or
        // destroy the only state and fail every attempt with
        // invalid_state — twice in a row on Nov 20, and Oct 28 too.
        // States older than 10 minutes are dropped; at most 5 kept.
        $states = collect($request->session()->get('workos_states', []))
            ->filter(fn ($s) => is_array($s) && time() - (int) ($s['at'] ?? 0) < 600)
            ->values()->all();
        $states[] = ['state' => $state, 'at' => time()];
        $request->session()->put('workos_states', array_slice($states, -5));
        $request->session()->put('workos_state', $state);
        // The session cookie does not always survive the WorkOS round
        // trip on iPhone: the flow can start in one browser view and
        // the callback can land in another, and the session is gone.
        // The state check must not depend on the session alone, so a
        // cache copy is kept keyed by the state value itself. The
        // callback accepts a state it finds in the cache, bound to the
        // host that started the login, single-use, 10 minutes.
        Cache::put('workos_state:'.$state, ['host' => $request->getHost(), 'at' => time()], 600);
        $authUrl = 'https://api.workos.com/user_management/authorize?'.http_build_query([
            'response_type' => 'code',
            'client_id' => $config['client_id'],
            'redirect_uri' => $redirectUri,
            'provider' => 'authkit',
            'screen_hint' => 'sign-in',
            'prompt' => 'login',
            'state' => $state,
        ]);

        // The header button is an Inertia link (in-page navigation), which
        // cannot jump to an outside sign-in page — the request dies silently
        // and the button looks dead. For Inertia requests, answer with
        // Inertia::location so the browser does a full visit to WorkOS.
        // Direct visits (typed URL, auth redirects) keep the plain 302.
        if ($request->header('X-Inertia')) {
            return Inertia::location($authUrl);
        }

        return redirect()->away($authUrl);
    }

    public function callback(Request $request): RedirectResponse
    {
        $fail = function (string $code) {
            Log::warning('WorkOS callback failed', ['code' => $code]);

            return redirect('/');
        };
        $config = config('services.workos');
        if (empty($config['client_id']) || empty($config['client_secret'])) {
            return $fail('not_configured');
        }
        if ($request->query('error')) {
            return $fail('workos_rejected');
        }
        $code = $request->query('code');
        $state = (string) $request->query('state', '');
        // Accept any recent state, not just the latest: the login may
        // have run twice (double-tap) before either callback arrives.
        // A failed check destroys nothing, so a second callback for
        // the other state still has its state to match against. The
        // used state is consumed only after a successful match, so a
        // replayed callback cannot reuse it.
        $candidates = collect($request->session()->get('workos_states', []))
            ->map(fn ($s) => is_array($s) ? (string) ($s['state'] ?? '') : (string) $s)
            ->filter()->values()->all();
        $legacy = (string) $request->session()->get('workos_state', '');
        if ($legacy !== '') {
            $candidates[] = $legacy;
        }
        $matched = false;
        if ($state !== '') {
            foreach ($candidates as $candidate) {
                if ($candidate !== '' && hash_equals($candidate, $state)) {
                    $matched = true;
                    break;
                }
            }
        }
        // Cache copy (see login()): a callback whose session did not
        // survive the round trip still validates when the state is in
        // the cache for this host and younger than 10 minutes.
        $cached = $state !== '' ? Cache::get('workos_state:'.$state) : null;
        $cachedMatch = is_array($cached)
            && ($cached['host'] ?? '') === $request->getHost()
            && time() - (int) ($cached['at'] ?? 0) < 600;
        $matched = $matched || $cachedMatch;
        $parts = explode('.', $state);
        $stateOk = $code && $matched && count($parts) === 2 && $parts[1] !== ''
            && hash_equals(hash_hmac('sha256', $parts[0], config('app.key')), $parts[1]);
        if (! $stateOk) {
            return $fail('invalid_state');
        }
        $remaining = collect($request->session()->get('workos_states', []))
            ->reject(fn ($s) => (is_array($s) ? (string) ($s['state'] ?? '') : (string) $s) === $state)
            ->values()->all();
        $request->session()->put('workos_states', $remaining);
        $request->session()->forget('workos_state');
        // Consume the cache copy too: a used state never validates twice.
        Cache::forget('workos_state:'.$state);
        try {
            $res = Http::asJson()->post('https://api.workos.com/user_management/authenticate', [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'client_id' => $config['client_id'],
                'client_secret' => $config['client_secret'],
            ]);
        } catch (\Throwable $e) {
            return $fail('workos_unreachable');
        }
        if (! $res->ok()) {
            return $fail('workos_rejected');
        }
        $email = strtolower((string) data_get($res->json(), 'user.email', ''));
        if (! $email) {
            return $fail('workos_rejected');
        }
        $owners = collect(explode(',', (string) ($config['owner_emails'] ?? '')))
            ->map(fn ($e) => strtolower(trim($e)))->filter()->all();
        if (! in_array($email, $owners, true)) {
            return $fail('not_owner');
        }
        $first = trim((string) data_get($res->json(), 'user.first_name', ''));
        $last = trim((string) data_get($res->json(), 'user.last_name', ''));
        $name = trim($first.' '.$last) ?: $email;
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => bcrypt(Str::random(40)),
                'role' => 'orchestrator',
                'email_verified_at' => now(),
            ]
        );
        Auth::login($user);
        $request->session()->regenerate();

        // Land back on the surface the sign-in started on. The entry
        // page stores it as the intended URL; without one, the surface
        // root is the right default on every host (tc shows Launches,
        // trade shows Markets, ops shows the console, plus shows the
        // portal). The main dashboard is not a Tress surface.
        return redirect()->intended('/');
    }
}
