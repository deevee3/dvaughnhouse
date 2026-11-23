<?php

use App\Http\Controllers\AttestationController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ManuscriptController;
use App\Http\Controllers\MarkdownController;
use App\Http\Controllers\OpsConsoleLoggedInController;
use App\Http\Controllers\PlusPortalController;
use App\Http\Controllers\PlusApiController;
use App\Http\Controllers\TressAuthController;
use App\Http\Controllers\TressColumnLoggedInController;
use App\Http\Controllers\TressLandingController;
use App\Http\Controllers\TressRpcController;
use App\Http\Controllers\TradingTerminalLoggedInController;
use App\Http\Controllers\WorkosAuthController;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Controllers\PortfolioMatrixController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EssayController;
use App\Http\Controllers\ResearchController;
use App\Http\Controllers\DrugShortageController;
use App\Http\Controllers\SopController;
use App\Http\Controllers\StandardsController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\TradingTerminalController;
use App\Http\Controllers\TressColumnController;
use App\Http\Controllers\VanguardLibraryController;
use Illuminate\Support\Facades\Route;

// Tress Column landing markdown (tc host only): the landing's own
// .md files. Registered before the global MarkdownController catch-all
// below, so /index.md on tc serves the landing markdown, not a 404.
Route::domain('tc.dvaughnhouse.com')->group(function () {
    Route::get('/{page}.md', [TressLandingController::class, 'markdown'])->name('tress-landing.md');
});

// AI-readable surfaces (ScrollLaunch prompt 1): generated from code,
// never hand-written static files. robots.txt is served by a route so
// it stays in sync with llms.txt and ai.txt (public/robots.txt removed).
// These skip the Inertia middleware: it force-sets `Vary: X-Inertia`,
// which would overwrite the `Vary: Accept` these responses must carry.
Route::get('/llms.txt', [MarkdownController::class, 'llmsTxt'])->name('ai.llms')->withoutMiddleware(HandleInertiaRequests::class);
Route::get('/llms-full.txt', [MarkdownController::class, 'llmsFullTxt'])->name('ai.llmsFull')->withoutMiddleware(HandleInertiaRequests::class);
Route::get('/ai.txt', [MarkdownController::class, 'aiTxt'])->name('ai.policy')->withoutMiddleware(HandleInertiaRequests::class);
Route::get('/robots.txt', [MarkdownController::class, 'robotsTxt'])->name('ai.robots')->withoutMiddleware(HandleInertiaRequests::class);
Route::get('/sitemap.xml', [MarkdownController::class, 'sitemapXml'])->name('ai.sitemap')->withoutMiddleware(HandleInertiaRequests::class);
Route::get('/api/md/_catalog', [MarkdownController::class, 'catalog'])->name('md.catalog')->withoutMiddleware(HandleInertiaRequests::class);
Route::get('/api/md/{path}', [MarkdownController::class, 'showApi'])->where('path', '.*')->name('md.api')->withoutMiddleware(HandleInertiaRequests::class);
// .md suffix for every public page (registered before the HTML routes;
// the pattern only matches paths ending in .md).
Route::get('/{path}.md', [MarkdownController::class, 'showMd'])->where('path', '.*')->name('md.page')->withoutMiddleware(HandleInertiaRequests::class);

// Research (ScrollLaunch prompt 2): original statistics from Glenride's own data.
Route::get('/research', [ResearchController::class, 'index'])->name('research.index');
Route::get('/research/attestations', [ResearchController::class, 'attestations'])->name('research.attestations');

// Drug-shortage hub (SEO): exact-match pages for the rising queries.
// Static pages — no database, no models, no live API calls.
Route::get('/drug-shortages/current', [DrugShortageController::class, 'current'])->name('drug-shortages.current');
Route::get('/drug-shortages/list', [DrugShortageController::class, 'list'])->name('drug-shortages.list');
Route::get('/drug-shortages/fda-list', [DrugShortageController::class, 'fdaList'])->name('drug-shortages.fda-list');
Route::get('/drug-shortages/ashp-vs-fda', [DrugShortageController::class, 'ashpVsFda'])->name('drug-shortages.ashp-vs-fda');

// store.dvaughnhouse.com lands on the storefront, not the library
Route::domain('store.dvaughnhouse.com')->group(function () {
    Route::get('/', fn () => redirect()->route('store.index'));
});

// Glenride institutional front door; the Vanguard Library lives at /library
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/library', [VanguardLibraryController::class, 'index'])->name('library.index');
Route::get('/briefs/{manuscript}', [VanguardLibraryController::class, 'show'])->name('briefs.show');
Route::get('/thesis', [VanguardLibraryController::class, 'thesis'])->name('thesis.index');


// Glenride Attestations — manual entry + anchor recording (auth, issuers only).
// The create route MUST register before the public /attestations/{key} route,
// otherwise "create" is captured as an attestation key.
Route::middleware('auth')->group(function () {
    Route::get('/attestations/create', [AttestationController::class, 'create'])->name('attestations.create');
    Route::post('/attestations/manual', [AttestationController::class, 'storeManual'])->name('attestations.storeManual');
    Route::get('/attestations/digest-queue', [AttestationController::class, 'digestQueue'])->name('attestations.digestQueue');
    Route::post('/attestations/digest-queue/{edition}', [AttestationController::class, 'attestDigest'])->name('attestations.attestDigest');
    Route::post('/attestations/{attestation}/anchor', [AttestationController::class, 'recordAnchor'])->name('attestations.recordAnchor');
    Route::post('/attestations/{attestation}/correct', [AttestationController::class, 'correct'])->name('attestations.correct');
});

// Public Glenride Attestations (Witness) — verify and key-statement must register before show
Route::get('/attestations', [AttestationController::class, 'index'])->name('attestations.index');
Route::post('/attestations/verify', [AttestationController::class, 'verify'])->name('attestations.verify');
Route::get('/attestations/key-statement', [AttestationController::class, 'keyStatement'])->name('attestations.keyStatement');
Route::get('/attestations/{key}', [AttestationController::class, 'show'])->name('attestations.show');

// Public Glenride standards
Route::get('/standards', [StandardsController::class, 'show'])->name('standards.show');

// Public Essays
Route::get('/essays', [EssayController::class, 'index'])->name('essays.index');
Route::get('/essays/{slug}', [EssayController::class, 'show'])->name('essays.show');

// The Economic Engine (Commercial Monetization & Executive Salons)
Route::get('/store', [StoreController::class, 'index'])->name('store.index');
Route::post('/store/checkout/intent', [StoreController::class, 'createPaymentIntent'])->name('store.intent');
Route::post('/store/checkout/confirm', [StoreController::class, 'confirmOrder'])->name('store.confirm');
Route::post('/store/webhook', [StoreController::class, 'webhook'])->name('store.webhook');

Route::get('/dashboard', [PortfolioMatrixController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Institutional Portfolio Matrix
    Route::get('/matrix', [PortfolioMatrixController::class, 'index'])->name('matrix.index');
    Route::get('/matrix/manuscripts/{manuscript}', [PortfolioMatrixController::class, 'show'])->name('matrix.show');
    Route::patch('/matrix/manuscripts/{manuscript}/status', [PortfolioMatrixController::class, 'updateStatus'])->name('matrix.updateStatus');
    Route::patch('/matrix/manuscripts/{manuscript}/content', [PortfolioMatrixController::class, 'updateContent'])->name('matrix.updateContent');

    // Manuscript Ingestion Dropzone
    Route::get('/manuscripts/intake', [ManuscriptController::class, 'create'])->name('manuscripts.create');
    Route::post('/manuscripts/intake', [ManuscriptController::class, 'store'])->name('manuscripts.store');
    Route::get('/manuscripts', [ManuscriptController::class, 'index'])->name('manuscripts.index');

    // STANZA Credit Ledger (orchestrator/admin only, enforced in controller)
    Route::get('/credits', [CreditController::class, 'index'])->name('credits.index');
    Route::post('/credits', [CreditController::class, 'store'])->name('credits.store');
    Route::get('/credits/{account}', [CreditController::class, 'show'])->name('credits.show');
    Route::post('/credits/{account}/grant', [CreditController::class, 'grant'])->name('credits.grant');
    Route::post('/credits/{account}/deposit', [CreditController::class, 'deposit'])->name('credits.deposit');
    Route::post('/credits/{account}/refund', [CreditController::class, 'refund'])->name('credits.refund');

    // Glenride Attestations — issue, challenge, revoke
    Route::post('/manuscripts/{manuscript}/attestations', [AttestationController::class, 'store'])->name('attestations.store');
    Route::post('/attestations/{attestation}/challenges', [AttestationController::class, 'challenge'])->name('attestations.challenge');
    Route::post('/attestations/{attestation}/revoke', [AttestationController::class, 'revoke'])->name('attestations.revoke');

    // Internal Standard Operating Procedures (Fellow Access Only)
    Route::get('/sops', [SopController::class, 'index'])->name('sops.index');
    Route::get('/sops/{slug}', [SopController::class, 'show'])->name('sops.show');
});

// Tress Column Three Interlocking Applications (Subdomain bindings).
// Live cutover Nov 20, 2026 (his tap): each domain serves the
// logged-in build at its root. Staging routes below stay live as the
// pre-live check. The legacy domain controllers are no longer served.
Route::domain('tc.dvaughnhouse.com')->group(function () {
    // tc root: landing page when signed out, Launches when signed in
    // (PRD §3). The seven landing sub-pages stay public, and the
    // waitlist form posts here and is proxied to the Pages function.
    Route::get('/', [TressLandingController::class, 'root'])->name('tress-column.domain');
    Route::get('/{page}', [TressLandingController::class, 'page'])
        ->where('page', 'how-it-works|certificate|fees|passes|terminal|console|security')
        ->name('tress-landing.page');
    Route::post('/api/waitlist', [TressLandingController::class, 'waitlist'])->name('tress-landing.waitlist');
    Route::get('/launches/{id}', [TressColumnLoggedInController::class, 'show'])->whereNumber('id')->name('tress-column.domain.show');
    Route::get('/start', [TressColumnLoggedInController::class, 'create'])->name('tress-column.domain.create');
    Route::get('/mine', [TressColumnLoggedInController::class, 'mine'])->name('tress-column.domain.mine');
});
Route::domain('trade.dvaughnhouse.com')->group(function () {
    Route::get('/', [TradingTerminalLoggedInController::class, 'markets'])->name('trading-terminal.domain');
    Route::get('/token/{address}', [TradingTerminalLoggedInController::class, 'token'])->name('trading-terminal.domain.token');
    Route::get('/activity', [TradingTerminalLoggedInController::class, 'activity'])->name('trading-terminal.domain.activity');
});
Route::domain('ops.dvaughnhouse.com')->group(function () {
    // Gated in the controller: no unauthenticated staff view exists
    // at any URL; signed-out requests go to the sign-in entry.
    Route::get('/', [OpsConsoleLoggedInController::class, 'index'])->name('ops-console.domain');
});
Route::domain('plus.dvaughnhouse.com')->group(function () {
    Route::get('/', [PlusPortalController::class, 'index'])->name('plus-portal.domain');
});

// Tress Column Plus+ API. Signed-in only; each route enforces its
// tier in PlusApiController. Subscription state is SaaS state;
// launch figures are on-chain state, labelled at the source.
Route::prefix('plus/api')->middleware(['web', 'auth'])->group(function () {
    Route::get('/subscription', [PlusApiController::class, 'subscription']);
    Route::post('/subscribe', [PlusApiController::class, 'subscribe']);
    Route::post('/subscription/cancel', [PlusApiController::class, 'cancelSubscription']);
    Route::get('/indexer-status', [PlusApiController::class, 'indexerStatus']);
    Route::get('/feed', [PlusApiController::class, 'feed']);
    Route::get('/feed/stream', [PlusApiController::class, 'feedStream']);
    Route::get('/radar', [PlusApiController::class, 'radar']);
    Route::post('/radar/verify', [PlusApiController::class, 'verifyClaim']);
    Route::get('/whales', [PlusApiController::class, 'whales']);
    Route::get('/snapshots', [PlusApiController::class, 'listSnapshots']);
    Route::post('/snapshots', [PlusApiController::class, 'createSnapshot']);
    Route::post('/snapshots/{snapshot}/compute', [PlusApiController::class, 'computeSnapshot']);
    Route::post('/snapshots/{snapshot}/generate-root', [PlusApiController::class, 'generateSnapshotRoot']);
    Route::get('/snapshots/{snapshot}/proof', [PlusApiController::class, 'snapshotProof']);
    Route::get('/snapshots/{snapshot}/export', [PlusApiController::class, 'exportSnapshot']);
    Route::get('/alerts', [PlusApiController::class, 'listAlerts']);
    Route::post('/alerts', [PlusApiController::class, 'createAlert']);
    Route::post('/alerts/{alert}/toggle', [PlusApiController::class, 'toggleAlert']);
    Route::delete('/alerts/{alert}', [PlusApiController::class, 'deleteAlert']);
    Route::get('/rebates', [PlusApiController::class, 'listRebates']);
    Route::post('/rebates', [PlusApiController::class, 'claimRebate']);
    Route::get('/support', [PlusApiController::class, 'listSupport']);
    Route::post('/support', [PlusApiController::class, 'createSupport']);
});

// Vanity certificate URL: /p/<tokenId> resolves to the same
// certificate record, on the launch page. Cosmetic only.
Route::get('/p/{tokenId}', [PlusPortalController::class, 'vanity'])->whereNumber('tokenId');

// Staging Preview Routes (Direct URL access across environments).
// The logged-in-state build renders the new pages on the staging
// routes too, so staging stays a working pre-live check after cutover.
Route::prefix('staging')->group(function () {
    Route::get('/tress-column', [TressColumnLoggedInController::class, 'index'])->name('tress-column.preview');
    Route::get('/tress-column/launches/{id}', [TressColumnLoggedInController::class, 'show'])->whereNumber('id')->name('tress-column.preview.show');
    Route::get('/tress-column/start', [TressColumnLoggedInController::class, 'create'])->name('tress-column.preview.create');
    Route::get('/tress-column/mine', [TressColumnLoggedInController::class, 'mine'])->name('tress-column.preview.mine');
    Route::get('/terminal', [TradingTerminalLoggedInController::class, 'markets'])->name('trading-terminal.preview');
    Route::get('/terminal/token/{address}', [TradingTerminalLoggedInController::class, 'token'])->name('trading-terminal.preview.token');
    Route::get('/terminal/activity', [TradingTerminalLoggedInController::class, 'activity'])->name('trading-terminal.preview.activity');
    Route::get('/ops-console', [OpsConsoleLoggedInController::class, 'index'])->name('ops-console.preview');
    Route::get('/plus', [PlusPortalController::class, 'index'])->name('plus-portal.preview');
});

// Tress Column sign-in entry (Albert Pass). The provider under the
// hood is never named in the UI.
Route::get('/auth/tress-entry', [TressAuthController::class, 'entry'])->name('tress.auth.entry');
Route::get('/auth/workos/login', [WorkosAuthController::class, 'login'])->name('workos.login');
Route::get('/auth/workos/callback', [WorkosAuthController::class, 'callback'])->name('workos.callback');
// The registered WorkOS redirect wildcard is https://*.dvaughnhouse.com/auth/callback
// (his words, Nov 20). The old /auth/workos/callback path does not match it, so
// WorkOS rejected every sign-in with redirect-uri-invalid. This is the live
// callback route now; login() sends this path. The workos path stays as an alias.
Route::get('/auth/callback', [WorkosAuthController::class, 'callback'])->name('workos.callback.alt');

// Tress Column read-only chain relay. Read methods only; the
// controller enforces the allowlist and rejects sends.
Route::post('/api/tc/rpc', [TressRpcController::class, 'relay'])->name('tc.rpc')->middleware('throttle:120,1');

require __DIR__.'/auth.php';
