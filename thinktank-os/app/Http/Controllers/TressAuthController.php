<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sign-in entry for the Tress Column surfaces.
 *
 * Sign-in is Albert Pass by Glenride. The provider under the hood is
 * never named in any user-facing copy. When the provider keys are not
 * present in the host environment, this entry shows the honest state
 * and offers the account sign-in instead, so staging stays usable.
 * The return URL is stored as the intended URL so a completed sign-in
 * lands back on the surface the user came from.
 */
class TressAuthController extends Controller
{
    public function entry(Request $request): Response
    {
        $return = (string) $request->query('return', '/');
        if (! str_starts_with($return, '/') || str_starts_with($return, '//')) {
            $return = '/';
        }
        $request->session()->put('url.intended', $return);

        $config = config('services.workos');
        $workosReady = ! empty($config['client_id'])
            && ! empty($config['client_secret'])
            && ! empty($config['redirect_uri'])
            && Route::has('workos.login');

        // The entry page is served on all four surfaces from one route,
        // so the surface comes from the host: the rail, the mark, and
        // the "signing in to" line must match the surface the user is
        // on, not always the Launchpad.
        $host = (string) $request->getHost();
        $surface = 'tc';
        foreach (['trade' => 'trade', 'ops' => 'ops', 'plus' => 'plus'] as $prefix => $key) {
            if (str_starts_with($host, $prefix.'.')) {
                $surface = $key;
                break;
            }
        }

        return Inertia::render('TressColumn/Auth/Entry', [
            'surface' => $surface,
            'workosReady' => $workosReady,
            'workosUrl' => $workosReady ? route('workos.login') : null,
            'loginUrl' => route('login'),
            'returnUrl' => $return,
        ]);
    }
}
