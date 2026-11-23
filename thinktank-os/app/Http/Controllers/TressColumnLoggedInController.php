<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * tc surface, logged-in state.
 *
 * Live on tc.dvaughnhouse.com since the Nov 20, 2026 cutover (his
 * tap); staging at /staging/tress-column stays as the pre-live check.
 */
class TressColumnLoggedInController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('TressColumn/LoggedIn/Index');
    }

    public function show(string $id): Response
    {
        abort_unless(ctype_digit($id) && (int) $id >= 1, 404);

        return Inertia::render('TressColumn/LoggedIn/Show', [
            'launchId' => (int) $id,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('TressColumn/LoggedIn/Create');
    }

    public function mine(): Response
    {
        return Inertia::render('TressColumn/LoggedIn/Mine');
    }
}
