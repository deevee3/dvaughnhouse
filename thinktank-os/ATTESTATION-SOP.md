# SOP — Attestation Issuance (ThinkTank OS / Witness)

**Version:** 1.0 — 2026-10-24 · **Status:** operating procedure, grounded in the
shipped system (ThinkTank OS attestation v1 2026-10-22 `551fcd1`, v2 `dcaef87`;
system reference: `ATTESTATION.md` in the thinktank-os repo).
**Authority:** Glenride is the attestation authority. **Proof, not promises.**

## 1. What an attestation is

A signed record binding four things: **the claim** (what was done, produced, or
asserted), **the evidence** (the trail behind it, recorded at issuance),
**the verifier** (the Glenride issuer who checked it), and **the timestamp**.
Public ID format: `GLR-AT-<year>-<6 uppercase alphanumerics>`. Signature:
HMAC-SHA256 over the canonical payload (`public_id`, subject type/id,
subject hash, `issued_at`), verified by recomputation on the public record.

Records live on **SpinWave** (the permanent store of record); ThinkTank OS is
the working surface. STANZA on Base is the public representation of the proof
layer (see §8 on anchoring).

## 2. What qualifies as a submittable subject

Two entry paths exist in the system; nothing else is attestable.

**A. Manuscript pipeline subjects.** A manuscript that has travelled the full
pipeline `submitted → ai_synthesized → human_polish → published`. Publication
creates the append-only SpinWave record (versioned, hash-parity with the
attestation subject hash). Only `published` manuscripts qualify — no
exceptions, no pre-publish issuance (see OPEN-ISSUES #4).

**B. Standalone subjects (manual entry).** Completed Glenride works outside
the manuscript pipeline: `report` (e.g. the weekly drug-shortage digest),
`dataset`, `external_work` (published essays, addresses), `other`. A subject
qualifies when: the work is **finished and fixed** (a reader could be handed
the exact artifact), its existence is **independently checkable** (a public
URL or a canonical file), and the claim drafted for it asserts **only what
the evidence supports**.

Not subjects: drafts, held pieces, applications/submissions made to third
parties, token mechanics or market materials, and anything whose claim would
need evidence Glenride does not hold.

## 3. Roles

- **Submitter** — whoever brings the work (author, desk, Janine). Prepares
  the subject + claim + evidence; never signs.
- **Verifier / Issuer** — a user with `canIssueAttestations()` (orchestrator,
  admin, editor). Checks the subject against this SOP and signs. An author
  never attests their own work by self-signing; a second set of eyes signs.
  In current practice the sole issuer account is the orchestrator.
- **Attestor of record** — Glenride (`issuer_name = Glenride` on every record).

## 4. Intake and completeness check (before any signature)

For each subject, the issuer confirms:

1. **Identity** — title exactly as published/filed; kind correctly classified.
2. **Gate (pipeline only)** — manuscript status is `published` **and** all
   three compliance checks are verified (ethics, transparency, citations —
   `isComplianceVerified()`). The service throws otherwise; there is no
   override.
3. **Claim** — minimum 10 characters, states what the evidence proves, no
   more. Publicational claims ("published on The Dispatch on <date>") are
   preferred for external works.
4. **Evidence** — at least one of: public URL of the work; canonical file
   whose SHA-256 is supplied as `subject_hash_override`; evidence notes
   naming the source system and the verification basis (who checked, when,
   how). Evidence is merged into the record's `evidence_manifest`
   (`manual_evidence`: notes + URLs) at issuance and cannot be edited after.
5. **Hash** — for file-backed subjects, the override must be the SHA-256 of
   the canonical file bytes, computed at intake — never copied from an
   unverified listing. For URL-only subjects, leave the override blank; the
   system computes its canonical hash (title, claim, kind, notes, sorted
   URLs). *Build note:* a canonical-JSON hash does not bind the bytes at the
   URL; if byte-binding is required later, export the work to a canonical
   file first and use its SHA-256.

## 5. Issuance

- **Pipeline:** from the Portfolio Matrix attestation panel or
  `/attestations/create` (from-manuscript mode) → `attestations.store`.
  Claim is prefilled and editable; evidence notes/URL optional additions.
- **Standalone:** `/attestations/create` → manual entry →
  `attestations.storeManual` → `AttestationService::issueManual()`.
- **Idempotency:** an active attestation for the same subject hash is
  returned instead of duplicated — re-submitting a loaded subject is safe.
  A changed subject (new hash) earns a new attestation; the old record is
  never edited (see CHALLENGE-SOP for amendment-by-supersession).
- **Credit debit (pipeline only):** if the manuscript is linked to a credit
  account and balance enforcement is on, issuance debits **75 TTOS**
  ($1.00) in the same transaction; insufficient balance rolls the attestation
  back. Manuscripts with no account are never blocked. **Manual standalone
  attestations are not debited** (current build; see OPEN-ISSUES #11).

## 6. Post-issuance verification (issuer, same session)

1. Open the public record (`/attestations/{public_id}`): status `issued`,
   **"Signature verified"** displayed.
2. For file-backed subjects: the record's subject hash equals the intake
   SHA-256.
3. For pipeline subjects: the record page / Library seal shows
   "Witnessed by Glenride · {public_id}" and the SpinWave record version the
   attestation bound to.
4. Log the issuance (public ID, subject, date) in the audit log.

## 7. Credits (TTOS) handling

- Unit: **TTOS**; fixed internal rate **75 TTOS = $1.00 USD**, isolated from
  STANZA price movement once converted.
- Budgets pay **up front**: a study/project `credit_accounts` row is funded
  by STANZA deposit (recorded manually by an orchestrator today:
  tx hash + amount + USD price → `recordDeposit()`, idempotent per tx/log
  index) or by orchestrator grant. Deposit address defaults to the STANZA
  treasury Safe `0x0f166D7631350dE1F9c4190dEA4fAE9565B19231`.
- Charge: **75 TTOS per pipeline attestation** (`type = attestation`,
  `reference = <public_id>`). Idempotent re-issuance is never charged.
- Refunds: unused TTOS are refundable to STANZA under the owner policy of
  2026-10-22 (basis = lower of original weighted-average vs current price,
  original-quantity cap, **25% restocking fee**, attestation-linked refunds
  eligible from 00:00 ET the day after issuance; orchestrator-executed,
  payout sent from the treasury Safe outside the app and recorded in the
  ledger). The system never refunds at an invented price.
- The deposit watcher (`credits:watch-deposits`) stays **off** and the
  STANZA price stays **manual** until the pool has real liquidity
  (OPEN-ISSUES #10).

## 8. On-chain anchoring

Anchoring is hash-only via the **Pearls AttestationRegistry** on Base —
never content. ThinkTank OS records anchors; it does not send transactions
(`AttestationService::recordAnchor()`, issuers only; validates tx hash,
contract, chain `base`/`base-sepolia`). The registry deploys with the STANZA
treasury Safe as on-chain `ISSUER`. Until an anchor is recorded, the public
page honestly reads "Not anchored." Deploy order: **Base Sepolia first,
third-party audit before mainnet** — both remain the owner's gates
(OPEN-ISSUES #2).

## 9. Turnaround and records

- Pipeline subjects: attestation is the step immediately after publish —
  same session (the UI prompts for it on publish). Target: no published
  manuscript sits unattested past the day of publication.
- Standalone subjects: staged in load packages (manifest + canonical files)
  and issued in batches; target turnaround **2 business days** from a
  complete package.
- Audit trail: the attestation record itself (immutable claim/evidence/
  signature/status history), the SpinWave record chain for pipeline subjects,
  the TTOS ledger for charges, and the workspace audit log for issuance
  batches. Records are never deleted to hide them — revocation is a status,
  not an erasure (see CHALLENGE-SOP).
