# SOP — Attestation Issuance (ThinkTank OS / Witness)

**Version:** 1.2 — 2026-11-17 · **Status:** operating procedure, grounded in the
shipped system (ThinkTank OS attestation v1 2026-10-22 `551fcd1`, v2 `dcaef87`;
system reference: `ATTESTATION.md` in the thinktank-os repo).
**Authority:** Glenride is the attestation authority. **Proof, not promises.**

**Amendment v1.2 (ordered by D'Vaughn House, 2026-11-17, federal alignment):**
the attestation statement accompanies every record above the signature block;
new issuances sign with Ed25519 under a published key ID and verify from the
published public key (legacy HMAC records verify as issued, never re-signed);
an independent RFC 3161 timestamp is requested for every new issuance; every
issuance appends to the hash-chained issuance log; corrections append a new
version linked to the original and never overwrite. No change to the v1.1
automation scope: automated issuance stays digest reports only.

**Amendment v1.1 (approved by D'Vaughn's tap, 2026-11-17, with the automated
digest attestation PRD):** automated issuance is authorized for weekly-digest
standalone subjects (`report`) when all six automated gates pass (see §10).
The issuer of record remains Glenride on the orchestrator account; the gates
+ the audit log + challenge/revoke are the control, replacing the second pair
of eyes for this subject class only. All other subject classes keep the v1.0
rule (a human issuer signs). Automation does not spread by default: any other
subject class needs its own amendment.

## 1. What an attestation is

A signed record binding four things: **the claim** (what was done, produced, or
asserted), **the evidence** (the trail behind it, recorded at issuance),
**the verifier** (the Glenride issuer who checked it), and **the timestamp**.
Public ID format: `GLR-AT-<year>-<6 uppercase alphanumerics>`. Signature:
Ed25519 over the canonical payload (record identity fields + the full
attestation statement text), verified from the published public key on the
key statement page; records issued before November 17, 2026 carry HMAC-SHA256
signatures and verify through the legacy path, exactly as issued. The
attestation statement (protocol §17) accompanies every record above the
signature block, on the public page and in the `.md` rendering. What
"attested" means: identity, origin, and integrity of the record, plus the
stated claim as published — not the truth of third-party data the record
reports, and not a federal certification.

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
- **Automated issuance (v1.1, digest reports only)** — the scheduled job
  executes the signature for weekly-digest `report` subjects when all six
  §10 gates pass, as the human principal's instrument, on the orchestrator
  account, with `entered_via = automated`. The human principal is D'Vaughn
  House, principal of Glenride; the system is never the attestor. The gates
  + audit log + challenge/revoke replace the second pair of eyes for this
  class only.
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
- **Automated (digest reports only, v1.1):** the scheduled job
  (`attestations:digest`) builds the row from the released digest artifact,
  runs the six §10 gates, and executes the signature via the same service
  logic with `entered_via = automated`, as the human principal's instrument.
  See §10.
- **Idempotency:** an active attestation for the same subject hash is
  returned instead of duplicated — re-submitting a loaded subject is safe.
  A changed subject (new hash) earns a new attestation; the old record is
  never edited (see CHALLENGE-SOP for amendment-by-supersession).
  **Correction (v1.2):** to fix a record, issue a correction — a new
  version (N+1) with a new public ID, linked to the original, signed fresh,
  with its own chain entry. The original stays readable and is marked
  superseded. A revoked record cannot be corrected; it stays revoked.
- **Credit debit (pipeline only):** if the manuscript is linked to a credit
  account and balance enforcement is on, issuance debits **75 TTOS**
  ($1.00) in the same transaction; insufficient balance rolls the attestation
  back. Manuscripts with no account are never blocked. **Manual standalone
  attestations are not debited** (current build; see OPEN-ISSUES #11).
  Automated digest attestations are likewise not debited.

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

## 10. Automated digest attestation (v1.1)

Authorized by D'Vaughn's tap, 2026-11-17 (automated digest attestation PRD,
§9 defaults). Scope: weekly drug-shortage digest editions only, kind
`report`, attested artifact = the full paid digest.

- **Trigger:** release of the edition's artifact. The trigger row carries the
  exact published title, the canonical file (stored path), the public URL
  where one exists, and the digest run's figures + retrieval date.
- **Preparation:** the row is built from the digest run itself — never free
  text, never invented. Claim follows the PRD §6.2 template; every figure
  comes from the digest run. A missing figure fails preparation; the item is
  held, never filled in.
- **Gates (all must pass; any failure holds the item, never signed past):**
  1. Finished + fixed: the published edition exists and the canonical file
     is on disk.
  2. Checkable: the public URL returns 200 where the artifact is public; a
     paid artifact satisfies this gate through its canonical file + hash
     (gates 1 + 3).
  3. Hash parity: the SHA-256 of the canonical file equals the recorded
     subject hash.
  4. Claim fidelity: every figure in the claim matches the digest run's
     figures exactly; the claim asserts nothing beyond them.
  5. Identity: title exactly as published; kind `report`.
  6. No duplicates: no existing attestation already covers this edition
     (same URL + same hash). A duplicate trigger is a no-op.
- **Signing:** via `AttestationService` (the `issueManual` logic, reused),
  public ID + Ed25519 signature under the active published key ID, the
  attestation statement inside the signed payload, `entered_via = automated`,
  issuer of record Glenride on the orchestrator account, chain entry
  appended in the same transaction, and an independent RFC 3161 timestamp
  requested after the commit (a failed timestamp request never blocks
  issuance; the daily retry command stamps it later). The signing key stays
  in the application environment on the iMac (mode 600); it is never copied,
  logged, or transmitted. See protocol §§17–19.
- **Human source:** the human principal of every automated issuance is
  D'Vaughn House, principal of Glenride. Glenride is the issuer of record,
  acting through him; the system prepares and executes and is never named
  as the attestor. Every issuance records the standing authorization (this
  SOP v1.1 + his November 17, 2026 tap approving the PRD defaults) in the
  evidence record, the issuance log entry, the audit record, and the run
  email.
- **Failure handling:** a held item is recorded with the exact failed gate +
  reason, logged for Mission Control, and re-checked on the next run. After
  3 consecutive failed runs it stays held and waits on a human, with the
  reason standing. Held items are never silently skipped and never partially
  issued.
- **Human control:** challenge and revoke work exactly as for any other
  attestation. The issuance log records what was checked, what passed, what
  was signed, and when.
- **Triple-check:** the triple-check review layer (Checker One + Checker Two
  + Janine) reviews digest content before release; it is separate from these
  gates. The gates never fabricate a triple-check record, and a missing
  triple-check record is noted, not invented.
