<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Tress Column landing page on tc.dvaughnhouse.com.
 *
 * The landing page is the public face of tc: hero, tiers, trust line,
 * waitlist, and the seven sub-pages. It is the Nov 8 thinned version,
 * served from the app so sign-in lives on the same host. Content source
 * is the Pages deploy (~/workspace/deploys/tc); the files served here
 * are copies under resources/tress-landing, with asset paths rewritten
 * to /tress-column-assets/ and a sign-in link plus a cross-surface menu
 * added. Nothing in the Nov 8 copy was rewritten.
 *
 * Signed-out, tc root serves the landing page. Signed-in, the same URL
 * serves Launches (PRD §3: signed-out shows public content, sign-in
 * flips the surface to its logged-in state, nothing else disappears).
 * Staging keeps rendering Launches either way: it is the pre-live check
 * of the logged-in build, not the public face.
 *
 * The waitlist form posts here and is proxied to the live Pages
 * function, which owns the D1 waitlist table and the Resend notify.
 * The D1 binding and the Resend key are not touched; this proxy only
 * forwards the signup (with the visitor IP, so the function's own
 * rate limit still works) and returns the function's answer.
 */
class TressLandingController extends Controller
{
    private const PAGES = [
        'index',
        'how-it-works',
        'certificate',
        'fees',
        'passes',
        'terminal',
        'console',
        'security',
    ];

    private const PAGES_FUNCTION = 'https://tc-7bi.pages.dev/api/waitlist';

    public function root(Request $request): mixed
    {
        if (Auth::check()) {
            return app(TressColumnLoggedInController::class)->index();
        }

        return $this->page('index');
    }

    public function page(string $page): BinaryFileResponse
    {
        abort_unless(in_array($page, self::PAGES, true), 404);

        return response()->file(
            resource_path("tress-landing/{$page}.html"),
            ['Content-Type' => 'text/html; charset=utf-8']
        );
    }

    public function markdown(string $page): BinaryFileResponse
    {
        abort_unless(in_array($page, self::PAGES, true), 404);

        return response()->file(
            resource_path("tress-landing/{$page}.md"),
            ['Content-Type' => 'text/markdown; charset=utf-8']
        );
    }

    public function waitlist(Request $request): JsonResponse
    {
        try {
            $res = Http::timeout(10)
                ->withHeaders([
                    // Forward the visitor IP so the function's own
                    // per-IP rate limit still works. Do NOT forward
                    // CF-Connecting-IP: Cloudflare rejects inbound
                    // requests carrying its own header (error 1000).
                    'X-Forwarded-For' => $request->ip(),
                ])
                ->withBody((string) $request->getContent(), 'application/json')
                ->post(self::PAGES_FUNCTION);

            $body = $res->json();
            if (! is_array($body)) {
                $body = ['ok' => false, 'error' => 'waitlist_unavailable'];
            }

            return response()->json($body, $res->status());
        } catch (\Throwable) {
            return response()->json(['ok' => false, 'error' => 'waitlist_unavailable'], 503);
        }
    }
}
