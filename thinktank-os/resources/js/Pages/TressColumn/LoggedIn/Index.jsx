import { Link, usePage } from '@inertiajs/react';
import { TressShell } from '../../../TressColumn/components/TressShell';
import { LaunchList } from '../../../TressColumn/components/LaunchList';
import { PLUS_TIERS } from '../../../TressColumn/tressConfig';
import { plusUrl, tcUrl } from '../../../TressColumn/urls';

const PLUS_KEYS = ['SAPPHIRE', 'EMERALD', 'RUBY'];

export default function Index() {
    const { auth } = usePage().props;
    const user = auth?.user || null;
    const signInHref = `/auth/tress-entry?return=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`;

    const action = user ? (
        <Link className="tc-button-primary" href={tcUrl('/start')}>
            Start a launch
        </Link>
    ) : (
        <a className="tc-button-primary" href={signInHref}>
            Sign in
        </a>
    );

    const emptyAction = user ? (
        <Link className="tc-button-primary" href={tcUrl('/start')}>
            Start a launch
        </Link>
    ) : (
        <a className="tc-button-primary" href={signInHref}>
            Sign in with Albert Pass
        </a>
    );

    return (
        <TressShell surface="tc" title="Launches" active="launches" action={action}>
            <LaunchList linkTo="launch" emptyAction={emptyAction} />
            {user && (
                <section className="tc-section" aria-labelledby="tc-plus-h">
                    <h2 className="tc-h2" id="tc-plus-h"><span className="tc-index">//02</span>Plus+</h2>
                    <p className="tc-lede">
                        Launches stays free. Sign in and start one. Plus+ adds tools
                        for traders, creators, and studios. The passes page says what
                        each pass adds today.
                    </p>
                    <ul className="tc-feature-list">
                        {PLUS_KEYS.map((key) => (
                            <li className="tc-feature" key={key}>
                                <span className="tc-feature-name">
                                    {PLUS_TIERS[key].name}, ${PLUS_TIERS[key].priceMonthly} a month
                                </span>
                                <span className="tc-feature-note">{PLUS_TIERS[key].target}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="tc-block-gap-top">
                        <a className="tc-button-primary" href={plusUrl()}>
                            See Plus+ passes
                        </a>
                    </div>
                </section>
            )}
        </TressShell>
    );
}
