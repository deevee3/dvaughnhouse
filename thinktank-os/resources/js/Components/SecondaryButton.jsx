export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-md border border-line bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink shadow-sm transition duration-150 ease-in-out hover:bg-paper-deep focus:outline-none focus:ring-2 focus:ring-sienna-deep focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-25 dark:border-line-dark dark:bg-night-card dark:text-cream dark:hover:bg-night-deep dark:focus:ring-sienna dark:focus:ring-offset-night ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
