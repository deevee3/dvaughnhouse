import InstitutionalHeader from '@/Components/InstitutionalHeader';
import SiteFooter from '@/Components/SiteFooter';
import { Head, Link } from '@inertiajs/react';

export default function KeyStatement({ keys = {}, active_key_id = '', identity = '', auth }) {
    const entries = Object.entries(keys);

    return (
        <div className="min-h-screen bg-paper font-serif text-ink selection:bg-sienna selection:text-ink dark:bg-night dark:text-cream">
            <Head title="Signing Key Statement - Glenride Attestations" />

            <InstitutionalHeader auth={auth} active="attestations" subtitle="Glenride Attestations" />

            <main className="mx-auto max-w-4xl px-6 py-16">
                <Link
                    href={route('attestations.index')}
                    className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft transition hover:text-ink dark:text-cream-soft dark:hover:text-cream"
                >
                    ← Back to the registry
                </Link>

                <div className="mt-8 border-b border-line pb-10 dark:border-line-dark">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-cream sm:text-4xl">
                        Signing key statement
                    </h1>
                    <p className="mt-4 leading-relaxed text-ink-soft dark:text-cream-soft">
                        Every Glenride attestation issued from November 17, 2026 is signed with
                        Ed25519, and verifies from the public keys below. Anyone can verify a
                        signature without trusting Glenride&apos;s server: the public key, the
                        fingerprint, and the identity it binds to are published here, in the
                        open.
                    </p>
                </div>

                <section className="mt-10">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        The binding
                    </h2>
                    <p className="mt-3 leading-relaxed text-ink dark:text-cream">
                        Each key below is bound to <strong>{identity}</strong>. The binding is
                        Glenride&apos;s published statement. It is <strong>not</strong> a
                        certificate issued by a certificate authority, and no certificate
                        authority has verified it. The binding is Glenride&apos;s word,
                        published where anyone can check it against the signatures.
                    </p>
                    <p className="mt-3 leading-relaxed text-ink-soft dark:text-cream-soft">
                        Glenride follows the federal standards named in its attestation protocol
                        in good faith. Glenride is not a federal agency. This statement is not a
                        federal certification, and no federal agency has endorsed it.
                    </p>
                </section>

                <section className="mt-10">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        Published keys
                    </h2>
                    {entries.length === 0 ? (
                        <p className="mt-4 text-sm text-ink-soft dark:text-cream-soft">
                            No signing keys are published yet.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-6">
                            {entries.map(([keyId, key]) => (
                                <div
                                    key={keyId}
                                    className="rounded-2xl border border-line bg-paper-deep p-6 dark:border-line-dark dark:bg-night-deep sm:p-8"
                                >
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-mono text-sm text-sienna-deep dark:text-sienna">
                                            {keyId}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-sienna px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-ink">
                                            {key.status || 'active'}
                                        </span>
                                        {keyId === active_key_id && (
                                            <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-paper dark:bg-cream dark:text-ink">
                                                Current signing key
                                            </span>
                                        )}
                                    </div>
                                    <dl className="mt-4 space-y-4">
                                        <div>
                                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                                Algorithm
                                            </dt>
                                            <dd className="mt-1 text-sm text-ink dark:text-cream">
                                                {key.algorithm || 'Ed25519'} (FIPS 186-5)
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                                Public key (base64)
                                            </dt>
                                            <dd className="mt-1 break-all font-mono text-xs leading-relaxed text-ink dark:text-cream">
                                                {key.public_key}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                                Fingerprint (SHA-256 of the public key)
                                            </dt>
                                            <dd className="mt-1 break-all font-mono text-xs leading-relaxed text-ink dark:text-cream">
                                                {key.fingerprint}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                                Bound identity
                                            </dt>
                                            <dd className="mt-1 text-sm text-ink dark:text-cream">
                                                {key.identity}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                                Effective from
                                            </dt>
                                            <dd className="mt-1 text-sm text-ink dark:text-cream">
                                                {key.effective_from}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                        Records issued before November 17, 2026 were signed with HMAC and verify
                        through the legacy path on their own pages. They are never re-signed.
                        Retired keys stay published forever, so signatures made under them keep
                        verifying.
                    </p>
                </section>

                <section className="mt-10 border-t border-line pt-10 dark:border-line-dark">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        If a key is compromised
                    </h2>
                    <p className="mt-3 leading-relaxed text-ink dark:text-cream">
                        If the private key is ever exposed, lost, or suspected compromised, the
                        human principal revokes it: the key&apos;s status above changes to
                        revoked, a new key is generated and published under a new key ID, and
                        every attestation signed under the revoked key is reviewed. Revocation
                        never deletes the public key from this page — a revoked key stays listed
                        so the record of what it signed stays checkable. The full procedure is
                        in the attestation protocol, section 18.
                    </p>
                </section>

                <section className="mt-10 border-t border-line pt-10 dark:border-line-dark">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        How to verify a signature yourself
                    </h2>
                    <p className="mt-3 leading-relaxed text-ink dark:text-cream">
                        Take the record&apos;s public page, the public key above, and the
                        canonical payload described in the attestation protocol (section 17):
                        the signature is the Ed25519 signature of that payload. Any standard
                        Ed25519 verifier confirms it. The page itself recomputes the check and
                        shows the result.
                    </p>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
