<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        if (empty($config['client_id']) || empty($config['redirect_uri'])) {
            return redirect('/');
        }
        $nonce = (string) Str::uuid();
        $sig = hash_hmac('sha256', $nonce, config('app.key'));
        $state = $nonce.'.'.$sig;
        $request->session()->put('workos_state', $state);
        $authUrl = 'https://api.workos.com/user_management/authorize?'.http_build_query([
            'response_type' => 'code',
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'provider' => 'authkit',
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
        $sessionState = (string) $request->session()->pull('workos_state', '');
        $parts = explode('.', $state);
        $stateOk = $code && $sessionState === $state && count($parts) === 2
            && hash_equals(hash_hmac('sha256', $parts[0], config('app.key')), $parts[1]);
        if (! $stateOk) {
            return $fail('invalid_state');
        }
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

        return redirect()->intended(route('dashboard'));
    }
}
