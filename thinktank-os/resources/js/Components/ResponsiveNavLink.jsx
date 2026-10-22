import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l py-2 pe-4 ps-3 ${
                active
                    ? 'border-sienna-deep bg-paper-deep text-sienna-deep focus:border-sienna-deep focus:bg-paper-deep focus:text-sienna-deep dark:border-sienna dark:bg-night-deep dark:text-sienna dark:focus:border-sienna dark:focus:bg-night-deep dark:focus:text-sienna'
                    : 'border-transparent text-ink-soft hover:border-line hover:bg-paper-deep hover:text-ink focus:border-line focus:bg-paper-deep focus:text-ink dark:text-cream-soft dark:hover:border-line-dark dark:hover:bg-night-deep dark:hover:text-cream dark:focus:border-line-dark dark:focus:bg-night-deep dark:focus:text-cream'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
