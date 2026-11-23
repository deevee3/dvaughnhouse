<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * trade surface, logged-in state (staging routes only).
 *
 * The domain routes still point at TradingTerminalController. No live
 * cutover happens without his explicit tap naming it.
 */
class TradingTerminalLoggedInController extends Controller
{
    public function markets(): Response
    {
        return Inertia::render('TradingTerminal/LoggedIn/Markets');
    }

    public function token(string $address): Response
    {
        abort_unless((bool) preg_match('/^0x[a-fA-F0-9]{40}$/', $address), 404);

        return Inertia::render('TradingTerminal/LoggedIn/Token', [
            'tokenAddress' => strtolower($address),
        ]);
    }

    public function activity(): Response
    {
        return Inertia::render('TradingTerminal/LoggedIn/Activity');
    }
}
