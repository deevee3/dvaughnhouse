<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Social cards: X / link previews read the served HTML, so these
             live in the shell, not in JS. Per-page titles come from Inertia;
             these are the site-wide defaults. --}}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Glenride" />
        <meta property="og:url" content="https://dvaughnhouse.org/" />
        <meta property="og:title" content="Glenride — Independent, AI-native think tank" />
        <meta property="og:description" content="Find where critical systems break before harm, and publish a record anyone can check." />
        <meta property="og:image" content="https://dvaughnhouse.org/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Glenride — Independent, AI-native think tank" />
        <meta name="twitter:description" content="Find where critical systems break before harm, and publish a record anyone can check." />
        <meta name="twitter:image" content="https://dvaughnhouse.org/og-image.jpg" />


        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=bricolage-grotesque:700,800|newsreader:400,400i,500,500i,600,600i&amp;display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
        {{-- AEO: structured data for answer engines (store page only; harmless elsewhere) --}}
        @isset($storeSeo)
        <script type="application/ld+json">{!! $storeSeo['jsonLd'] !!}</script>
        @endisset
    </head>
    <body class="bg-paper font-serif text-ink antialiased dark:bg-night dark:text-cream">
        @inertia
        {{-- AEO: plain-text catalog summary for crawlers that don't run JS.
             Same offers and prices as the interactive storefront — no cloaking. --}}
        @if(isset($storeSeo) && ($page['component'] ?? null) === 'Store/Index')
        <noscript>
            <div>
                <h1>The Store</h1>
                <p>The Glenride store: field guides from Reynard's, tools and publications from Glenride, and executive briefings for institutions. Every listing tells you exactly what you get — no product takes payment before its price and terms are published.</p>
                <h2>What can I buy from the store?</h2>
                <p>{{ $storeSeo['faqAnswer'] }}</p>
                <h2>Products and prices (as of {{ $storeSeo['asOf'] }})</h2>
                <ul>
                    @foreach($storeSeo['products'] as $sp)
                    <li><strong>{{ $sp['name'] }}</strong> — {{ $sp['tagline'] }}@if($sp['priceLabel']) — {{ $sp['priceLabel'] }}@endif ({{ $sp['statusLabel'] }}). {{ $sp['description'] }}</li>
                    @endforeach
                </ul>
                <p>Updated: {{ $storeSeo['updated'] }}.</p>
            </div>
        </noscript>
        @endif
    </body>
</html>
