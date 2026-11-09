# Attestation — Open Issues & Executive Decisions

**Compiled:** 2026-10-24 · Sources: `ATTESTATION.md` "Open decisions" (the six
the build deliberately left to the owner), the attestation concept doc
(`~/workspace/your_files/attestation-layer/concept.md`), and a live system
inventory taken 2026-10-24. Each item: the issue, then the decision made under
D'Vaughn's 2026-10-24 executive-decision grant (decide first, triple-check,
defend in writing — he ratifies later).

**Every decision below is marked: Decided 2026-10-24 under executive-decision
grant — pending ratification.**

---

## 1. Council co-signing — individuals or the Council as a body?

**Issue:** V1 is Glenride-editor-only. The Council on AI & Supply-Chain
Resilience is the intended human attestation network, but its seats are
mostly unfilled (only the last-mile freight seat is taken).

**Decision:** Council members attest as **named individuals**: when a member
is ready, they receive an editor-role account and sign as themselves
(`verifier_id` is a person in the data model). No "Council as a body"
signer exists or will be simulated. Revisit body attestation only when at
least three domain seats are filled.
**Defense:** the verifier is a named field in every record — per-person
accountability *is* the product ("proof, not promises"). A collective signer
would need schema and governance that don't exist, for a Council that
doesn't yet. Individual domain experts signing in their names is also the
stronger marketing claim.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 2. Pearls / Base anchoring — lock-in, timing, threshold

**Issue:** OS-side anchor recording is built; the AttestationRegistry
deploy is gated (Sepolia first, audit before mainnet) with no volume
threshold defined for "when volume warrants."

**Decision:** Anchor on **Base Sepolia at the next build window**; mainnet
anchoring unlocks at the **earlier of (a) 25 live attestations or (b) the
first external funded study requiring anchors** — and only after the
third-party audit, which stays the owner's spend gate. Platform stays
Pearls, chain stays Base, ISSUER stays the STANZA treasury Safe.
**Defense:** an undefined threshold is a decision that never fires. 25
records is reachable from Glenride's own output (9 are staged in the
2026-10-24 load package alone), proving the anchor flow before a sponsor
depends on it; the study trigger protects revenue if a sponsor arrives
first.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 3. Challenge economics — free today; staking later?

**Issue:** V1 challenges are free and reputational. Staking-to-challenge
and slashing were named in the concept but never designed.

**Decision:** Challenges stay **free** in v2. No staking, no slashing.
Revisit only on evidence: **three or more dismissed-as-baseless challenges**
in the registry, or the first external submitter cohort, whichever comes
first. Abuse until then is handled procedurally (dismissal + account
action per CHALLENGE-SOP §4/§6).
**Defense:** on a young registry, the scarce resource is willingness to
challenge — a deposit taxes exactly the scrutiny that makes the registry
credible, and credible challengeability is the marketing difference between
Witness and a badge printer. Mechanism design for a problem not yet
observed would be invention, not engineering.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 4. Pre-publish issuance

**Issue:** V1 requires `published`. Whether an attestation could be issued
during human polish and revealed at publish was left open.

**Decision:** **No.** The published-only gate stands, permanently for
pipeline subjects.
**Defense:** the attestation binds to the SpinWave record, which is created
*at* publish with hash parity to the attestation's subject hash. Pre-publish
issuance would either bind to an unrecorded subject or force a second
record model — breaking the one clean invariant (publish = record = attest)
that the public verification story rests on. The publish→attest prompt
already makes the sequence a single session's work.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 5. First attested product beyond manuscripts

**Issue:** The system supports standalone subjects (digest, essays, other
Glenride output); the order was the owner's call, undecided.

**Decision:** The **weekly drug-shortage digest is the first standing
standalone subject class**, attested per edition via manual entry. The
2026-10-19 edition is item #1 of the 2026-10-24 load package, alongside the
already-published Dispatch essays and the Oct 22 State of the Union
address. Order within the package: digest first, then essays, then the
address.
**Defense:** the digest is real, recurring, independently verifiable
(ASHP/FDA figures), and sponsor-legible — the exact shape of the future
vendor-requirement business. A weekly attested artifact also grows the
public registry on a cadence, which is the cheapest credible marketing the
attestation layer can have.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 6. Revenue — who pays for attestation at scale

**Issue:** Producer vs reader vs platform was undecided in the concept doc;
the settled model (2026-10-22) already answers part of it: prepaid project
budgets, attestation as a study vendor line item.

**Decision:** **Producer-pays, via prepaid budgets — confirmed and closed.**
Readers never pay; verification stays public and free. The per-attestation
price holds at **75 TTOS ($1.00)** until the first external study prices
attestation into its budget, at which point the study's contracted rate
governs for that study. Institutional licensing is deferred until the
registry exceeds **100 records**.
**Defense:** charging readers would tax verification — the one action the
whole model needs to be free. Producer-pays matches the vendor-requirement
positioning (sponsors already budget compliance vendors), and the built
TTOS ledger already executes it. A licensing tier before 100 records is a
product in search of a registry.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 7. Duplicate publication in the load set ("The Journals Are Still a Graveyard")

**Issue:** The piece is live at two Dispatch URLs (`/the-journals-are-still-a-graveyard/`
and `/the-journals-are-still-a-graveyard-2/`). Attesting both would double-record
one work; attesting the wrong one binds the record to a URL slated for removal.

**Decision:** Attest the **first URL as canonical** (load package item #7).
The `-2` duplicate is a blog-side cleanup (redirect or unpublish) for the
owner's Ghost admin — flagged, not executed here.
**Defense:** one work, one record is the registry's core invariant; the
first URL is the one the sitemap and feed carried first.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 8. Test credit data in the production ledger

**Issue:** The only credit account is named **"Test"** (balance 569,866
TTOS) with two grant rows, one carrying a garbage reference string. The
credits ledger is part of the public trust story; an auditor-facing ledger
with test junk in it undercuts "proof, not promises" the first time an
external study reviews it.

**Decision:** Before any external study is granted an account, the Test
account is **retired** (zeroed by an orchestrator adjustment with a recorded
reason, or renamed and annotated as internal test funds) and replaced by a
properly named **Glenride Operating Budget** account. The three seeded
Library manuscripts stay untouched — they are the live Library and carry
the first attestations.
**Defense:** the ledger's credibility is a sales asset for the
vendor-requirement pitch; cleaning it costs one orchestrator action now
versus an explanation in every sponsor diligence call later. Execution is
an in-app orchestrator action (the owner's session) — deliberately not
done by direct database write.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 9. Manual standalone attestations are never debited

**Issue:** `issueManual()` carries no TTOS charge, while pipeline
attestations debit 75 TTOS. An asymmetry a sponsor could read as the
registry's own works riding free.

**Decision:** **Keep the asymmetry for Glenride's own output** (registry
growth is marketing spend, absorbed by the house). The moment an **external
submitter's** work is attested standalone, it is charged 75 TTOS from a
funded account — which requires a build note: `issueManual()` needs an
optional credit-account parameter and the same debit path as `issue()`.
Until that build lands, external standalone attestation is not offered.
**Defense:** charging ourselves rent to grow our own registry is circular;
charging external work is the revenue model. Naming the build gap now
prevents an awkward free tier from existing by accident.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 10. Deposit watcher and STANZA price source

**Issue:** `credits:watch-deposits` is built but off; the STANZA price is a
manual config value. Both wait on "real liquidity."

**Decision:** Both stay as they are — watcher **off**, price **manual** —
until the STANZA pool shows sustained liquidity, judged at the same review
as the anchoring threshold (Issue #2). No price is ever invented to make a
deposit credit.
**Defense:** the build already refuses to credit at an unconfigured price;
automating deposits against a thin, manipulable price would put bad
numbers into an append-only ledger. Manual recording is the audit-friendly
path at current volume.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 11. Brand — "Witness" is still a working title

**Issue:** The concept recommends Witness; surfaces already ship
"Witnessed by Glenride," but name/domain/trademark clearance was deferred
and never scheduled.

**Decision:** **Witness stands** as the public attestation brand (product
name "Witness," stamp line "Witnessed by Glenride," tagline "Proof, not
promises."). Clearance (trademark search, domain) is scheduled as a
pre-external-customer task, bundled with the Issue #2/§6 triggers — not
before.
**Defense:** the name is already in production surfaces; renaming later
would strand the earliest records' branding. Clearance spend before the
first external customer is cost without a counterparty.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*

## 12. Documentation split — ATTESTATION.md lives only on the iMac

**Issue:** The system's attestation reference lives in the thinktank-os
repo on the iMac; the VM workspace held only the concept doc. SOPs written
in one place only would repeat the split.

**Decision:** Attestation documentation lives **beside `ATTESTATION.md` in
the thinktank-os repo** (ATTESTATION-SOP.md, CHALLENGE-SOP.md,
OPEN-ISSUES.md — placed there by this pass) and is **mirrored** to
`~/workspace/your_files/thinktank-os-sops/` on the VM. The repo copy is
canonical; the mirror is refreshed whenever the repo copy changes.
**Defense:** the people and agents who run the system read the repo; the
operator's long-term memory reads the workspace. Both doors, one text.
*Decided 2026-10-24 under executive-decision grant — pending ratification.*
