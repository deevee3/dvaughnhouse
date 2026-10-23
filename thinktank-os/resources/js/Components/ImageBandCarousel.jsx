import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ImageBandCarousel — a full-width rotating image band for page bodies.
 *
 * Images stay full-bleed and edge-to-edge under a flat ink scrim, with a
 * single static overlay line shared by every slide. Auto-advances every
 * 6.5s unless the visitor hovers, focuses inside, or prefers reduced
 * motion (then manual controls only).
 */
export default function ImageBandCarousel({ images = [], overlayLine, label = 'Image carousel' }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const timer = useRef(null);

    const goTo = useCallback(
        (i) => setIndex(((i % images.length) + images.length) % images.length),
        [images.length],
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
        if (paused || reducedMotion || images.length < 2) return undefined;
        timer.current = setInterval(() => {
            setIndex((i) => (i + 1) % images.length);
        }, 6500);
        return () => clearInterval(timer.current);
    }, [paused, reducedMotion, images.length]);

    if (images.length === 0) return null;

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label={label}
            className="relative flex h-[380px] items-center justify-center overflow-hidden bg-ink text-paper dark:text-cream sm:h-[460px] lg:h-[520px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {images.map((src, i) => (
                <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    aria-hidden={i !== index}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                        i === index ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            ))}

            {/* Flat ink scrim */}
            <div className="absolute inset-0 bg-ink/50" aria-hidden="true" />

            {/* Static overlay line */}
            {overlayLine && (
                <p className="relative px-6 text-center font-display text-4xl font-bold tracking-tight sm:text-5xl">
                    {overlayLine}
                </p>
            )}

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-6 px-6">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={prev}
                        aria-label="Previous image"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-paper/40 text-paper transition hover:border-paper hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sienna"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={next}
                        aria-label="Next image"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-paper/40 text-paper transition hover:border-paper hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sienna"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center gap-2.5">
                    {images.map((src, i) => (
                        <button
                            key={src}
                            type="button"
                            onClick={() => goTo(i)}
                            aria-label={`Go to image ${i + 1}`}
                            aria-current={i === index ? 'true' : undefined}
                            className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sienna ${
                                i === index ? 'w-8 bg-sienna' : 'w-2.5 bg-paper/40 hover:bg-paper/70'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
