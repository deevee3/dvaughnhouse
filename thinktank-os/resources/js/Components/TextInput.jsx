import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-md border-line bg-paper text-ink shadow-sm focus:border-sienna-deep focus:ring-sienna-deep dark:border-line-dark dark:bg-night-card dark:text-cream dark:focus:border-sienna dark:focus:ring-sienna ' +
                className
            }
            ref={localRef}
        />
    );
});
