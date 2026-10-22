import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-sienna-deep text-ink focus:border-sienna-deep dark:border-sienna dark:text-cream dark:focus:border-sienna'
                    : 'border-transparent text-ink-soft hover:border-line hover:text-ink focus:border-line focus:text-ink dark:text-cream-soft dark:hover:border-line-dark dark:hover:text-cream dark:focus:border-line-dark dark:focus:text-cream') +
                className
            }
        >
            {children}
        </Link>
    );
}
