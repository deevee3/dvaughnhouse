import { Link } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * HeroCarousel — full-bleed, image-led hero with rotating slides.
 *
 * Each slide carries its own headline, line, and call to action.
 * Images stay hero images: full-bleed, overlaid with a flat ink scrim.
 * Auto-advances every 6.5s unless the visitor hovers, focuses inside,
 * or prefers reduced motion (then manual controls only).
 */
export default function HeroCarousel({ slides = [], children }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const timer = useRef(null);

    const goTo = useCallback(
        (i) => setIndex(((i % slides.length) + slides.length) % slides.length),
        [slides.length],
    );
    const next = useCallback(() => goTo(index + 1), [goTo, index]);
    const prev = useCallback(() => goTo(index - 1), [goTo, index]);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const onChange = (e) => setReducedMotion(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (paused || reducedMotion || slides.length < 2) return undefined;
        timer.current = setInterval(() => {
            setIndex((i) => (i + 1) % slides.length);
        }, 6500);
        return () => clearInterval(timer.current);
    }, [paused, reducedMotion, slides.length]);

    if (slides.length === 0) return null;
    const slide = slides[index];

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label="Glenride highlights"
            className="relative flex min-h-[88vh] items-center overflow-hidden bg-ink text-paper dark:bg-night-deep dark:text-cream"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {/* Slides — full-bleed images, crossfading */}
            {slides.map((s, i) => (
                <img
                    key={s.image}
                    src={s.image}
                    alt=""
                    aria-hidden={i !== index}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                        i === index ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            ))}

            {/* Flat ink scrim */}
            <div className="absolute inset-0 bg-ink/60" aria-hidden="true" />

            {/* Overlay copy */}
            <div className="relative mx-auto w-full max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
                <h1 className="font-display text-6xl font-extrabold leading-none tracking-tight sm:text-7xl lg:text-8xl">
                    Glenride
                </h1>

                <div key={index} className="animate-rise mt-10 max-w-3xl">
                    <p className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                        {slide.headline}
                    </p>
                    <p className="mt-5 max-w-2xl text-xl leading-relaxed text-paper/85 dark:text-cream-soft sm:text-2xl">
                        {slide.line}
                    </p>
                    <div className="mt-8">
                        <Link
                            href={slide.ctaHref}
                            className="inline-flex items-center rounded-lg bg-sienna px-6 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-sienna-deep hover:text-paper"
                        >
                            {slide.ctaLabel}
                        </Link>
                    </div>
                </div>

                {children}

                {/* Controls */}
                <div className="mt-14 flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={prev}
                            aria-label="Previous slide"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-paper/40 text-paper transition hover:border-paper hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sienna dark:border-line-dark dark:text-cream dark:hover:bg-cream dark:hover:text-night"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="Next slide"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-paper/40 text-paper transition hover:border-paper hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sienna dark:border-line-dark dark:text-cream dark:hover:bg-cream dark:hover:text-night"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {slides.map((s, i) => (
                            <button
                                key={s.image}
                                type="button"
                                onClick={() => goTo(i)}
                                aria-label={`Go to slide ${i + 1}: ${s.headline}`}
                                aria-current={i === index ? 'true' : undefined}
                                className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sienna ${
                                    i === index
                                        ? 'w-8 bg-sienna'
                                        : 'w-2.5 bg-paper/40 hover:bg-paper/70'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
