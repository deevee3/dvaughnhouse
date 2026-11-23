// Sign-in entry. Albert Pass is the one shared identity. The provider
// under the hood is never named in this UI. Branded to the canonical
// Tress Column Brand Guidelines (PDF 2026-11-20): PDF palette, glass
// tier card over the tonal wash, //01 //02 editorial indexing,
// chamfered CTA. The shell header already carries //01 Sign in.

import { TressShell } from '../../../TressColumn/components/TressShell';

const SURFACE_LABELS = {
    tc: 'the Launchpad',
    trade: 'Markets',
    ops: 'the Ops console',
    plus: 'Plus+',
};

const SURFACE_ACTIVE = {
    tc: 'launches',
    trade: 'markets',
    ops: 'console',
    plus: 'portal',
};

export default function Entry({ surface, workosReady, workosUrl, loginUrl }) {
    const label = SURFACE_LABELS[surface] || SURFACE_LABELS.tc;
    const active = SURFACE_ACTIVE[surface] || SURFACE_ACTIVE.tc;
    return (
        <TressShell surface={surface} title="Sign in" active={active}>
            <div className="tc-tier-glass-field">
                <div className="tc-card tc-tier-card">
                    <p className="tc-lede">
                        Sign in with Albert Pass.
                    </p>
                    <p className="tc-empty-body">
                        Every term set at inception. Never changed after.
                        You are signing in to {label}.
                    </p>
                    <h2 className="tc-h2">
                        <span className="tc-index">//02</span>One identity
                    </h2>
                    <ul className="tc-feature-list">
                        <li className="tc-feature">
                            <span className="tc-feature-name">Launchpad</span>
                            <span className="tc-feature-note">Configure and lock launches.</span>
                        </li>
                        <li className="tc-feature">
                            <span className="tc-feature-name">Markets</span>
                            <span className="tc-feature-note">Trade launched tokens.</span>
                        </li>
                        <li className="tc-feature">
                            <span className="tc-feature-name">Ops console</span>
                            <span className="tc-feature-note">Watch launches and locks.</span>
                        </li>
                        <li className="tc-feature">
                            <span className="tc-feature-name">Plus+</span>
                            <span className="tc-feature-note">Feed, radar, and workbench passes.</span>
                        </li>
                    </ul>
                    <p className="tc-empty-body">
                        One identity for Tress Column, Markets, the ops console, and Plus+.
                        One sign-in covers all four surfaces. Sessions last 50 minutes.
                        Your wallet stays separate: signing in does not connect a wallet.
                    </p>
                    {workosReady ? (
                        <a className="tc-button-primary" href={workosUrl}>
                            Continue with Albert Pass
                        </a>
                    ) : (
                        <div>
                            <p className="tc-empty-body">
                                Albert Pass is not connected yet.
                            </p>
                            <a className="tc-button-primary" href={loginUrl}>
                                Sign in with your account
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </TressShell>
    );
}
