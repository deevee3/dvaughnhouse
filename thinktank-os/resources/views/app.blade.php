<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

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
