// The ThinkTank OS stylesheet loads only on non-Tress pages. Tress Column
// surfaces are scoped to tress-tokens.css (Brand Guidelines 2026-11-20)
// via TressShell, so the shared stylesheet and its off-brand palette
// never reach them.
// Dynamic import keeps app.css out of the Tress bundle entirely.
if (!document.body.classList.contains('tc-page')) {
    import('../css/app.css');
}
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => {
        // Tress Column pages carry their own "Tress Column — ..." title
        // (TressShell sets it); never append the ThinkTank OS app name.
        if (document.body.classList.contains('tc-page')) {
            return title || 'Tress Column';
        }
        return title ? `${title} - ${appName}` : appName;
    },
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
