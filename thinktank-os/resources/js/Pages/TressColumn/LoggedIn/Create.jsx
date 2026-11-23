import { usePage } from '@inertiajs/react';
import { SignInPrompt, TressShell } from '../../../TressColumn/components/TressShell';
import { LaunchFlow } from '../../../TressColumn/components/LaunchFlow';
import { tcUrl } from '../../../TressColumn/urls';

export default function Create() {
    const { auth } = usePage().props;
    const user = auth?.user || null;

    return (
        <TressShell surface="tc" title="Start a launch" active="create">
            {user ? (
                <LaunchFlow />
            ) : (
                <SignInPrompt what="start a launch" returnTo={tcUrl('/start')} />
            )}
        </TressShell>
    );
}
