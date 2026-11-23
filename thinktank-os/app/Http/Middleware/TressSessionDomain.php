<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Share the session cookie across the Tress Column surfaces.
 *
 * Nov 20, 2026 (his word: the surfaces "just loop around"): after
 * signing in on one surface, the other three showed signed-out and
 * each demanded its own sign-in, because the session cookie was
 * host-only (SESSION_DOMAIN=null) while the session store itself is
 * shared. This middleware sets the session cookie domain to the
 * shared parent (SESSION_SHARED_DOMAIN, .dvaughnhouse.com) — but
 * ONLY when the request host is actually under that parent.
 *
 * The host check matters: the same container also serves staging on
 * dvaughnhouse.org, and a browser rejects a Set-Cookie whose Domain
 * does not match the origin host, so a blanket shared domain would
 * break sessions on staging. Staging and local dev keep host-only
 * cookies (domain null). An explicit SESSION_DOMAIN still wins when
 * set; this middleware only fills the gap when it is not.
 *
 * Prepended to the web group so it runs before StartSession, which
 * reads the cookie domain from config when it issues the cookie.
 */
class TressSessionDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        $explicit = config('session.domain');
        if ($explicit === null || $explicit === '') {
            $shared = (string) config('session.shared_domain', '');
            if ($shared !== '') {
                $host = strtolower($request->getHost());
                $parent = ltrim($shared, '.');
                if ($host === $parent || str_ends_with($host, '.'.$parent)) {
                    config(['session.domain' => $shared]);
                }
            }
        }

        return $next($request);
    }
}
