/**
 * SiteFooter — shared legal footer for the public ThinkTank OS surfaces
 * (Vanguard Library, Store). Legal documents live centrally on
 * dvaughnhouse.com; this footer links there.
 */
export default function SiteFooter() {
    const legal = [
        { label: 'About', href: 'https://dvaughnhouse.com/#about' },
        { label: 'Contact', href: 'https://dvaughnhouse.com/#contact' },
        { label: 'Terms of Service', href: 'https://dvaughnhouse.com/terms' },
        { label: 'Privacy Policy', href: 'https://dvaughnhouse.com/privacy' },
    ];

    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-bold tracking-tight text-white">
                        D&rsquo;Vaughn House
                    </p>
                    <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
                        {legal.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        © 2026 D&rsquo;Vaughn House. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-500">
                        A Glenride project. Built independent.
                    </p>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
                    Nothing on this site is financial, legal, investment, or medical
                    advice. Token and market content is educational only. Products are
                    sold as described at checkout — nothing here promises profit,
                    income, or any particular result.
                </p>
            </div>
        </footer>
    );
}
