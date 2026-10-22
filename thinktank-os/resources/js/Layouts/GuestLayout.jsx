import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-paper-deep dark:bg-night-deep pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-ink-soft dark:text-cream-soft" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden border border-line bg-paper px-6 py-4 shadow-md dark:border-line-dark dark:bg-night-card sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
