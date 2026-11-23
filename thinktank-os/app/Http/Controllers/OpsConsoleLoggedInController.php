<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ops surface, logged-in state.
 *
 * Staff allowlist, decided Nov 17, 2026: D'Vaughn only. The gate is
 * enforced here, in the controller: no unauthenticated staff view
 * exists at any URL, and a signed-in non-staff user gets a plain
 * denial page with no staff data on it.
 *
 * Live on ops.dvaughnhouse.com since the Nov 20, 2026 cutover (his
 * tap); staging at /staging/ops-console stays as the pre-live check.
 * The sign-in return is the path the user actually came from, so a
 * domain visit returns to the domain, not to staging.
 */
class OpsConsoleLoggedInController extends Controller
{
    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('tress.auth.entry', ['return' => '/'.ltrim($request->path(), '/')]);
        }

        $staff = config('tress.staff_emails', []);
        if (! in_array(strtolower((string) $user->email), $staff, true)) {
            return Inertia::render('OpsConsole/LoggedIn/Denied');
        }

        return Inertia::render('OpsConsole/LoggedIn/Index', [
            'staffEmail' => $user->email,
        ]);
    }
}
