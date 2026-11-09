# SOP — Challenging an Attestation (ThinkTank OS / Witness)

**Version:** 1.0 — 2026-10-24 · **Status:** operating procedure, grounded in
the shipped challenge flow (ThinkTank OS attestation v1/v2; system reference:
`ATTESTATION.md`). **Principle:** an attestation authority that can't be
challenged is just a priesthood. Challenges are public by design.

## 1. What a challenge is

A signed-in user's formal, public objection to an attestation in force,
filed with stated grounds. Filing a challenge flips the attestation's status
from `issued` to **`challenged` immediately and in public** — the record page
shows the status, the challenger's name, and the grounds. There is no
pre-screening and no silent queue: visibility is the mechanism.

## 2. Who may challenge

Any signed-in ThinkTank OS user (`POST /attestations/{attestation}/challenges`,
active records only — `issued` or already `challenged`). Anonymous challenges
are not supported by the build. Glenride issuers may challenge like anyone
else; issuer power enters at adjudication/revocation, not at filing.

## 3. Grounds and evidence standard

Grounds are required (minimum 10 characters) and should name one of:

- **Wrong subject** — the record's hash does not match the work it claims to
  bind (evidence: the challenger's own SHA-256 of the canonical artifact).
- **False or overstated claim** — the claim asserts more than the evidence
  manifest supports (evidence: quote the claim, cite what the manifest
  actually shows).
- **Evidence failure** — cited evidence is missing, unreachable, or does not
  say what the record relies on (evidence: the dead/mismatched source).
- **Provenance defect** — the work is misattributed, predated, or not the
  author's/publisher's to record (evidence: the prior/true source).
- **Process defect** — the issuance gate was not met (e.g. compliance checks
  unverified at issuance) (evidence: the record/state relied on).

Vague disagreement ("this is wrong") without a checkable assertion does not
meet the standard and is resolved as dismissed with a note saying so. The
strongest challenges are reproducible: a hash, a link, a quote.

## 4. State while challenged

- Status `challenged` is displayed everywhere the record surfaces (registry,
  record page, Library seal) — reliance on the record is visibly at-risk.
- The underlying work is **not** unpublished and the record is **not**
  altered; the challenge attaches to it (`attestation_challenges` row:
  challenger, grounds, `status = open`, timestamps).
- TTOS already debited for the attestation is **not** auto-refunded during
  a challenge. *Build note:* there is no freeze/escrow state for credits in
  the current build — a refund consequence only arises from the outcome in
  §6, executed manually under the credits policy.
- *Build note:* the current build has no rate limit or deposit on challenges.
  Abuse handling is procedural (§6 dismissal + account action) until volume
  justifies mechanism (OPEN-ISSUES #3).

## 5. Adjudication

- **Adjudicator:** an issuer (orchestrator/admin/editor) who is **not** the
  original verifier of the challenged record, where a second issuer exists;
  while Glenride has a sole issuer, the challenge and its resolution are
  reviewed against this SOP in the open and the conflict is noted on the
  resolution.
- **Path:** (1) reproduce the challenge's check (hash, link, quote) against
  the record and the canonical artifact; (2) give the original verifier's
  evidence manifest the same check; (3) decide on the reproduced facts, not
  on reputation; (4) record the outcome with a `resolution_note`.
- **Timeline:** acknowledge (first adjudicator touch) within **2 business
  days**; resolve within **10 business days** of filing. If resolution needs
  evidence only a third party holds, the challenge stays `open`, the delay
  and the missing item are noted on the record.

## 6. Outcomes — and how each is recorded

- **Dismissed** (challenge does not meet the standard, or its check fails):
  challenge row → `status = dismissed` + resolution note; attestation
  returns to `issued`. The challenge remains listed on the public record —
  dismissed challenges are part of the record's history, not deleted.
- **Upheld — claim amended by supersession:** records are append-only, so
  an upheld challenge never edits the original. The original attestation is
  **revoked** (reason citing the upheld challenge) and, where the work
  itself stands, a **new attestation** is issued bound to the corrected
  claim/evidence (new public ID; its evidence manifest cites the revoked
  record and the challenge). The public trail reads: issued → challenged →
  revoked → superseded.
- **Upheld — record revoked:** issuer revokes with a recorded reason and
  timestamp (`POST /attestations/{attestation}/revoke`, issuers only,
  active records only). Status `revoked` is permanent and public; the
  record, its challenges, and the revocation reason stay in the registry.
- **Credit consequence:** where an attestation is revoked on an upheld
  challenge, the linked credit account is made whole for that attestation's
  75 TTOS under the credits refund policy (attestation-linked refunds are
  eligible from 00:00 ET the day after issuance; the revocation date governs
  in practice). Executed by an orchestrator and recorded in the ledger —
  never automatic in the current build.

## 7. What a challenge is not

- Not a comment thread: one filing per user per attestation; discussion
  belongs elsewhere.
- Not a takedown of the underlying work: publication records on SpinWave
  stand or fall by their own process; a challenge rules on the
  **attestation**, and an upheld provenance challenge is the input to any
  separate unpublish decision by the owner.
- Not anonymous, not private, and not deletable by the challenger after
  filing — filing is itself a public act, symmetric with attesting.
