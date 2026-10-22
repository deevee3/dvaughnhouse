export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-md border border-transparent bg-sienna px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink transition duration-150 ease-in-out hover:bg-sienna-deep hover:text-paper focus:bg-sienna-deep focus:text-paper focus:outline-none focus:ring-2 focus:ring-sienna-deep focus:ring-offset-2 focus:ring-offset-paper active:bg-sienna-deep active:text-paper dark:focus:ring-sienna dark:focus:ring-offset-night ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
