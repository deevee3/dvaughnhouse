/**
 * ImageBand — a full-width supporting image band for page bodies.
 *
 * Image-led and edge-to-edge (never a framed side plate). No overlay
 * copy: the band carries the page visually between content blocks.
 */
export default function ImageBand({ src }) {
    return (
        <section aria-hidden="true" className="relative w-full overflow-hidden bg-ink">
            <img
                src={src}
                alt=""
                loading="lazy"
                className="h-[320px] w-full object-cover sm:h-[400px] lg:h-[460px]"
            />
        </section>
    );
}
