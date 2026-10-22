export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-line bg-paper text-sienna-deep shadow-sm focus:ring-sienna-deep dark:border-line-dark dark:bg-night-card dark:focus:ring-sienna ' +
                className
            }
        />
    );
}
