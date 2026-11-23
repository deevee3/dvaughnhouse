# Glenride Attestation Protocol

Version 2.0 — November 17, 2026.

This document is the formal operating protocol for Glenride's attestations.
It states, in checkable steps, how a published work becomes a signed
attestation, how failures are handled, and how the whole record can be
verified after the fact. The automated weekly-digest attestation is the
worked example running through it (sections 4–12); the signing, statement,
timestamping, chain, correction, and key rules in sections 7, 10, and
17–23 govern every attestation Glenride issues, by every entry path. It is
written so an auditor or a funder can follow every step without trusting
any person's word for it: each step names what is checked, where the
evidence lives, and what happens when a check fails.

## 0. Nature of this document

This is an internal operating protocol. It is not a contractual agreement,
and it is not under clinical-study protocol review purview. It governs how
Glenride's own system prepares, checks, signs, publishes, and records
attestations of its own published digests. No lawyer-review step or gate is
part of this process.

This protocol governs the code. If the code and this protocol ever disagree,
the code is fixed to the protocol and the discrepancy is reported. The
protocol, the PRD (ThinkTank OS digest attestation PRD, October 29, 2026,
approved November 17, 2026), and the Attestation SOP v1.2 are kept
consistent; a change to one is a change to all three.

## 0.1. Federal alignment — the honesty boundary

No United States federal definition or standard for a research artifact
being "officially attested" exists, and no federal program recognizes a
private attestation process. Glenride claims neither. The correct claim,
used verbatim wherever alignment is described, is:

> Glenride follows the named federal standards in good faith; Glenride is
> not a federal agency; no federal agency has endorsed the attestation.

The standards this protocol follows in good faith are named in section 17.
Glenride never claims federal certification, federal approval, or agency
endorsement, and never claims a FIPS 140-3 validated module (none is in
use). Anything this protocol cannot do at zero cost without a new account
is listed as a residual blocked item in section 23, with the exact need —
never presented as closed.

## 1. Words used in this protocol

- **Attestation.** A signed record stating that a specific published work
  says what Glenride claims it says. An attestation certifies the identity,
  origin, and integrity of the record, plus the stated claim as published.
  It does not certify the truth of third-party data the record reports.
  It is not a federal certification (section 22 states the meaning once,
  in full).
- **Attestation statement.** The fixed statement that accompanies every
  attested artifact, placed above the signature block, in the wording
  approved November 17, 2026 (section 17). For new issuances the statement
  text is inside the signed payload.
- **Digest.** Glenride's weekly drug-shortage digest: a published edition
  reporting the week's shortage figures.
- **Claim.** The single sentence an attestation stands behind. For digests
  it follows a fixed template (section 5) filled with the digest run's
  figures.
- **Gate.** A check that must pass before signing. There are six (section 6).
  Any failed gate holds the edition; nothing signs past a failure.
- **Hash (SHA-256).** A 64-character fingerprint computed from a file's
  exact bytes. Any change to the file, however small, produces a different
  fingerprint. Comparing hashes proves a file is byte-for-byte the file that
  was recorded.
- **Signature (Ed25519).** The tamper-evident seal on records issued from
  November 17, 2026: an Ed25519 signature (FIPS 186-5) over the canonical
  record, verifiable by anyone from the published public key. The signed
  payload includes the full attestation statement text, so any change to
  the statement, the claim, the fingerprint, the issuer, or the issue time
  breaks verification.
- **Signature (HMAC-SHA256, legacy).** The seal on records issued before
  November 17, 2026: HMAC-SHA256 over the canonical record, keyed by the
  application key. Legacy records verify through the legacy path, exactly
  as issued. They are never re-signed.
- **Key ID.** The identifier of the signing key a record was signed under
  (for example, `glenride-ed25519-2026-11`). Every new record carries its
  key ID, and every public key ever used stays published, so a key rotation
  never breaks verification of older records.
- **Trusted timestamp.** An RFC 3161 timestamp token from an independent
  timestamp authority, requested over the exact signed bytes. It proves
  the signed payload existed at the authority's stated time. It does not
  prove the truth of the record's contents.
- **Correction / supersession.** A correction appends a new version of a
  record, linked to the original, which stays readable and is marked
  superseded. Nothing is ever overwritten or deleted (section 21).
- **Anchor.** A periodic publication of the issuance chain head to an
  independent public location, so earlier chain hashes survive
  independently of the issuing database (section 20).
- **Public ID.** The human-readable identifier of an attestation, shaped
  like `GLR-AT-2026-XXXXXX`. It appears in the registry, on the verify page,
  and in every log entry.
- **Subject hash.** The SHA-256 fingerprint of the canonical digest file.
- **Canonical file.** The single stored copy of the digest edition that the
  attestation binds to. If the canonical file changes, the hash changes and
  the old attestation no longer describes it.
- **Held.** An edition that failed a gate. It is recorded with the exact
  failed gate and reason, and it is never signed until the failure is fixed.
- **Issuer of record.** The party in whose name attestations are issued:
  Glenride.
- **Human principal.** The human being who is the source of the attestation
  decision: D'Vaughn House, principal of Glenride.
- **Issuance log / chain.** The append-only, numbered, hash-linked record of
  every issued attestation (section 10).

## 2. Human source

Machines propose; humans are the source of all decisions. That principle
governs this protocol absolutely.

- The human principal of every attestation is **D'Vaughn House, principal of
  Glenride**. Glenride is the issuer of record, acting through him.
- The system prepares the attestation, runs the gates, and executes the
  signature as the human principal's instrument. The system is never named
  as the attestor, in any record, log, email, or page.
- Every automated issuance records the standing authorization under which
  the system executed the signature: SOP v1.1 automated issuance,
  authorized by D'Vaughn House's tap on November 17, 2026, approving the
  automated digest attestation PRD defaults. The authorization appears in
  the attestation's evidence record, in the issuance log entry, in the run
  audit record, and in the system-sent email.
- Challenge and revocation are retained by the human. Any signed-in Fellow
  may challenge an attestation with stated grounds; only Glenride editors
  and orchestrators may revoke one. The system never challenges or revokes
  on its own.
- The signing mechanics serve this section: the Ed25519 signature executes
  the human principal's decision, the statement above the signature names
  him as the attestor, and the authorization evidence is recorded on the
  record itself (section 17). What this section fixes is whose decision
  the signature executes, and where that is recorded.

## 3. Roles

| Role | Who | What they do |
|---|---|---|
| Human principal | D'Vaughn House | Source of every attestation decision. Grants and holds the standing authorization. Retains challenge and revocation. |
| Issuer of record | Glenride | The name under which attestations are issued, acting through the human principal. |
| Orchestrator account | The Glenride orchestrator user account in ThinkTank OS | The account the system signs under. It is the instrument, not the decision-maker. |
| System | The scheduled job and the shared attestation code | Prepares rows, runs gates, executes signatures, publishes, logs, and emails. Never the attestor. |
| Issuer (button) | A signed-in Glenride editor or orchestrator | May press Attest on a queued row. The button runs the same gates and signing code as the scheduled job. |
| Challenger | Any signed-in Fellow | May challenge any attestation in force, with stated grounds. |
| Reader / auditor | Anyone | May read the registry, verify a signature, and recompute the issuance chain. No account needed for public verification. |

## 4. Trigger and preparation

1. **Trigger.** The scheduled job runs daily at 10:00 AM Eastern on the
   iMac host, via the Laravel scheduler and a host systemd user timer
   (`thinktank-scheduler.timer`) that calls `schedule:run` every minute. Preparation leads to signing automatically:
   in steady state there is no human step between a digest being published
   and its attestation issuing.
2. **Queue.** Each digest edition is represented by a trigger row (a JSON
   file in storage under `digest-attestation/queue/`), prepared from the
   digest run. A row carries: the edition date, the subject title exactly
   as published, the kind `report`, the digest run figures (ASHP count, FDA
   in-shortage count, FDA total, retrieval date), the canonical file path,
   the recorded subject hash, the public URL where the edition is public,
   whether the edition is public or a paid artifact, and whether it is
   released.
3. **Canonical file.** The digest edition's canonical file is stored under
   `digest-attestation/files/`. The row's recorded hash must be the SHA-256
   of that file's bytes.
4. **Claim preparation.** The claim is built from the fixed template in
   section 5, filled with the row's digest run figures. No other claim
   wording is used for digest attestations.
5. **No invention.** The system never invents a figure, a title, a hash, or
   a review record. If a required value is missing, the row fails the gate
   that needs it and is held.

The triple-check review layer (Checker One, Checker Two, and Janine) is a
separate editorial process. It is not one of the six gates, and the gates
never block on it. If no triple-check record exists for a digest, that is
noted; no triple-check record is ever fabricated.

## 5. The claim template

Every digest attestation carries exactly this claim, with the bracketed
values filled from the digest run:

> Glenride's weekly drug-shortage digest for `<date>`: ASHP tracked `<n>`
> live shortage bulletins and the FDA listed `<m>` of `<k>` database entries
> in shortage, retrieved and verified on `<date>`.

`<date>` is the retrieval date written in full (for example, October 19,
2026). `<n>` is the ASHP live shortage bulletin count. `<m>` is the FDA
in-shortage count and `<k>` the FDA database total. The figures are taken
from the digest run record, never re-typed.

## 6. The six gates

The gates run in order. The first failure stops the run for that edition
and holds it with the exact failed gate and reason. All six must pass before
any signature is computed.

1. **Finished and fixed.** The edition is released, and its canonical file
   exists on disk. A draft, a slid edition, or a missing file fails this
   gate. What unblocks it: the edition is published and its canonical file
   is stored.
2. **Checkable.** Where the edition is public, its public URL returns HTTP
   200. A paid artifact satisfies this gate through the canonical file plus
   its hash (gates 1 and 3); no public URL is required for paid editions.
   What unblocks it: the public page is live, or the edition is correctly
   recorded as a paid artifact with file and hash.
3. **Hash parity.** The SHA-256 of the canonical file's current bytes
   equals the recorded subject hash. A mismatch — including a file edited
   after publication — fails this gate, because the attestation would bind
   to content that is no longer the published content. What unblocks it: a
   canonical file whose bytes match a hash recorded at release time. A
   post-publication edit can never be cured by re-recording the hash; the
   release-time hash is the record.
4. **Claim fidelity.** The built claim's figures match the digest run
   figures exactly, and any claim already recorded for the edition matches
   the built claim. What unblocks it: the digest run figures and the
   recorded claim are corrected to agree.
5. **Identity.** The subject title is exactly the title as published, and
   the kind is `report`. What unblocks it: the row carries the published
   title verbatim.
6. **No duplicates.** No existing attestation already covers the edition
   (same URL and hash, or same subject hash). A duplicate trigger is a
   no-op: no new attestation, no new sequence number, no new signature. The
   existing public ID is reported.

## 7. Signing

When all six gates pass, the system executes the signature using the same
signing code as every other attestation in the system. All issuance paths
— manuscript pipeline, manual entry, and automated digest — share this
one implementation; there is no second implementation.

1. A public ID is generated (`GLR-AT-YYYY-XXXXXX`, six random characters).
   Public IDs are unique and never reused (section 23).
2. The attestation statement is rendered from the pending record fields
   (section 17), and the canonical signed payload is built: the record's
   identity fields plus the full statement text, in the fixed key order
   and JSON encoding stated in section 17. The statement is inside the
   signed payload, so tampering with the statement breaks verification.
3. The payload is signed with Ed25519 (FIPS 186-5) under the active key
   ID. The private key lives only in the application environment on the
   iMac (section 18); it is never copied, printed, logged, or moved.
   If no signing key is configured, issuance fails closed: no unsigned
   attestation is ever created.
4. The attestation record is created with: the public ID, the subject
   title and kind `report`, the claim, the evidence record (title, kind,
   entered via `automated`, evidence notes, evidence URLs, subject hash,
   the human principal, and the authorization), the subject hash, the
   signature, the signature method `ed25519`, the key ID, the
   authorization evidence, the orchestrator account as verifier, the
   issuer name Glenride, the method `automated_digest_v1`, status
   `issued`, version 1, and the issue time.
5. The issuance log entry is appended in the same database transaction
   (section 10). If the attestation already existed (a race with another
   run), no log entry is appended. Direct (non-digest) issuances append
   with an empty gates list: the six gates are digest-only.
6. After the transaction commits, an independent RFC 3161 timestamp token
   is requested over the exact signed bytes (section 19). A failed
   request marks the record and never blocks or rolls back the issuance;
   the daily retry command stamps it later.
7. No credit debit is made for automated digest attestations. The debit
   rule applies to manuscript-pipeline attestations only.

Signing mechanics are identical for the scheduled path and the button path:
both call the same preparation, gates, and signing code. There is no second
implementation.

Legacy records (issued before November 17, 2026) carry HMAC signatures and
verify through the legacy path, recomputing the HMAC from the stored
record. Verification is dual: each record is verified by the method
recorded on it. Old records are never re-signed.

## 8. Publication

An issued attestation is published immediately:

1. **Registry.** The attestation appears in the public registry at
   `/attestations`.
2. **Verify page.** The attestation's public page shows the attestation
   statement above the signature block (printed name, role, date/time,
   signature value, key ID, timestamp), and recomputes the signature from
   the stored record. A matching recomputation proves the record is
   intact. The same statement and signature block appear in the `.md`
   rendering of the record.
3. **Issuance log.** The chain entry is visible to the verify command
   (section 10), and the chain head is anchored weekly to the public
   repository (section 20).
4. **Mission Control log.** The run's issuances and holds are logged to
   Mission Control (digest date, title, public ID, hash, gates, timestamp).
5. **Email.** The system-sent run email goes to the human principal
   (section 11).

## 9. Failure handling

- **Held.** Any gate failure holds the edition. The hold records the
  edition, the failed gate number, the exact reason, and the run time. The
  hold is written to the state file and the audit record, and reported in
  the run email with what unblocks it. A held edition is never signed.
- **Consecutive failures.** Each failed run for an edition increments its
  consecutive-failure count. A successful issuance clears it.
- **Three-run rule.** After 3 consecutive failed runs, the edition waits on
  a human: later scheduled runs skip it and report it as waiting, until a
  human re-runs it explicitly with the force option or fixes the failed
  gate. The wait is a pause, not a deletion: the row stays queued.
- **Missing file or URL.** An edition missing its canonical file or its
  required URL is held, not skipped. Held editions stay visible in the
  queue, in the audit record, and in the email until resolved.
- **Email failure.** If the run email cannot be sent, the run still
  completes: issuances stand, holds stand, and the email payload is written
  to the outbox file. A mail failure never rolls back an issuance.

## 10. Serialization: the append-only issuance log

Every issued attestation gets the next sequence number in an append-only
log. The log is a hash chain: each entry links to the one before it, so any
alteration, deletion, or reordering is detectable by recomputation.

### 10.1 Entry contents

Each entry records:

| Field | Meaning |
|---|---|
| `seq` | Sequence number. Monotonic, gap-free, starting at 0 for genesis. |
| `prev_hash` | The previous entry's entry hash. |
| `public_id` | The attestation's public ID. |
| `subject_hash` | The attestation's subject hash. |
| `gates_passed` | The list of gates passed: `[1, 2, 3, 4, 5, 6]` for digest issuances, `[]` for direct issuances (the six gates are digest-only). |
| `issued_at` | The attestation's issue time, in ISO 8601. |
| `human_principal` | D'Vaughn House, principal of Glenride. |
| `authorization` | The standing authorization under which the signature was executed (section 2). |
| `entry_hash` | SHA-256 over the canonical form of the fields above. |

### 10.2 Entry hash formula

The entry hash is SHA-256 over the canonical JSON array, with no spaces
and slashes unescaped:

```
[seq, prev_hash, public_id, subject_hash, gates_passed, issued_at_iso, human_principal, authorization]
```

`issued_at_iso` is the issue time formatted as ISO 8601 with its timezone
offset (for example, `2026-11-17T15:04:22+00:00`). `gates_passed` is the
JSON array of gate numbers in order.

### 10.3 Genesis entry

The chain begins with an explicit genesis entry, sequence 0, created
lazily by the first append:

| Field | Value |
|---|---|
| `seq` | `0` |
| `prev_hash` | 64 zero characters |
| `public_id` | `GENESIS` |
| `subject_hash` | SHA-256 of the string `glenride-witness-genesis-v1` |
| `gates_passed` | `[]` (empty: genesis is not an issuance) |
| `issued_at` | `2026-11-17T00:00:00+00:00` |
| `human_principal` | D'Vaughn House, principal of Glenride |
| `authorization` | `Genesis entry — chain anchor; no issuance, no authorization exercised.` |
| `entry_hash` | SHA-256 over the canonical form above |

### 10.4 Rules

- Sequence numbers are monotonic and gap-free, enforced by a uniqueness
  constraint and by appending inside a locked transaction.
- A duplicate trigger creates no new sequence number.
- A held edition gets no sequence number: it was never issued.
- Entries are never edited or deleted. A revoked attestation keeps its
  entry; revocation is recorded on the attestation itself, not by removing
  history.

### 10.5 Verification

The command `attestations:verify-chain` recomputes the whole chain from
genesis and reports:

- whether the sequence runs 0, 1, 2, … with no gaps;
- whether every entry's `prev_hash` equals the previous entry's
  `entry_hash`;
- whether every entry's `entry_hash` matches a recomputation from its
  stored fields;
- whether the genesis entry matches the defined genesis values;
- whether every non-genesis entry names an attestation that exists.

Any failure is reported by sequence number with the exact mismatch, and the
command exits non-zero. An empty log verifies as valid and empty.

## 11. The system-sent email

On every scheduled run, the system sends one email to the human principal
at dvaughnhouse@gmail.com. The email is sent by the job itself; it never
depends on chat, memory, or any person's judgment.

- **Issued editions** are listed with the digest title and date, the
  figures, the gates passed, the public ID, the registry link, the verify
  link, the human principal, and the authorization.
- **Held editions** produce an URGENT subject line naming the exact failed
  gate, the reason, and what unblocks it.
- **Duplicates** and **waiting** editions are listed plainly.
- Every payload is also written to an outbox file under
  `digest-attestation/outbox/`, whether or not delivery succeeds. If no
  working mail configuration exists, the payload is queued on disk and the
  missing configuration is reported; no credentials are ever invented.

## 12. The one-click attest button

The digest queue page (`/attestations/digest-queue`, issuer login required)
lists queued digest editions pre-filled with title, claim, evidence, URL,
and hash, with one Attest button per row.

- The button runs the same preparation, gates, and signing code as the
  scheduled job. A gate failure holds the row and shows the reason; the
  button never signs past a failure.
- The button is the human override and fallback control. It is not the
  steady-state path: steady state signs automatically after preparation.
- A test proves the button path and the automatic path share the gates: one
  gate failure blocks both.

## 13. Challenge and revocation

- Any signed-in Fellow may challenge an attestation in force, with stated
  grounds of at least 10 characters. A challenge marks the record
  `challenged` in public until resolved.
- Only Glenride editors and orchestrators may revoke an attestation, with a
  stated reason. Revocation marks the record `revoked` with the time and
  reason; the issuance log entry is kept.
- Challenge and revocation are human acts, retained by the human. The
  system never challenges or revokes on its own.

## 14. Host, schedule, and key custody

- **Host.** The iMac. The scheduled job runs in the ThinkTank OS Docker
  application container; a host systemd user timer
  (`thinktank-scheduler.timer`) calls `schedule:run` every minute. (This
  host has no crontab; the systemd timer is the scheduling mechanism.)
- **Schedule.** Daily at 10:00 AM Eastern. The command processes whatever
  rows are queued; it is a no-op when none are queued.
- **Key custody.** The Ed25519 private signing key lives only in the
  application's environment on the iMac (mode 600). It is never copied,
  printed, logged, committed, emailed, or moved. The public key and its
  fingerprint are published on the key statement page and in the signing
  key configuration (section 18). No Sepolia or mainnet deployment is part
  of this protocol; an on-chain anchor remains a separately authorized act,
  recorded on the attestation when performed.

## 15. Records kept

| Record | Location | Contents |
|---|---|---|
| Attestation | Database, `attestations` | Public ID, subject, claim, evidence record, hash, signature, signature method, key ID, timestamp token, authorization evidence, verifier, issuer, method, status, version, supersession link, times. |
| Issuance log | Database, `attestation_issuance_log` | Section 10 entries. Append-only: model guards + a database trigger refuse updates and deletes. |
| Chain anchors | Public repository, `docs/attestation-anchors/` | One JSON anchor per chain head (section 20). |
| Key statement | Public page `/attestations/key-statement` + `config/attestation.php` | Published public keys, fingerprints, bound identity, effective dates, statuses. |
| Deposit packages | Storage, `deposit-packages/` | Registry metadata exports prepared for independent deposit (section 23). |
| Queue rows | Storage, `digest-attestation/queue/` | One JSON file per edition. |
| Canonical files | Storage, `digest-attestation/files/` | The bound digest files. |
| Held state | Storage, `digest-attestation/state.json` | Consecutive failures and waiting flags. |
| Audit record | Storage, `digest-attestation/audit.jsonl` | One JSON line per run outcome. |
| Email outbox | Storage, `digest-attestation/outbox/` | One JSON payload per run. |
| Scheduler log | Storage, `logs/digest-attestation-scheduler.log` | Scheduled run output. |

## 17. The attestation statement and the signed payload

Every attestation record carries the attestation statement, placed ABOVE
the signature block, on the public page, in the `.md` rendering, and —
for issuances from November 17, 2026 — inside the signed payload. The
statement is rendered deterministically from the record's stored fields,
so the displayed statement always matches the record; for already-issued
records the display is read-only and never changes a signed byte.

The wording is fixed (approved November 17, 2026). Only the bracketed
fields vary per record:

> ATTESTATION STATEMENT
>
> I, D'Vaughn House, principal of Glenride, attest the following about the
> artifact identified below. This record is the exact artifact described:
> its contents match the fingerprint shown. It was issued by Glenride,
> through me as human principal, on the date and time shown. The claim
> stated below reflects the record as published, verified through the
> checks named in the Glenride attestation protocol.
>
> This attestation certifies the identity, origin, and integrity of this
> record. It does not certify the truth of third-party data the record
> reports.
>
> Glenride follows the federal standards named in its attestation protocol
> in good faith. Glenride is not a federal agency. This attestation is not
> a federal certification, and no federal agency has endorsed it.
>
> Artifact: [title] | Kind: [kind] | Identifier: [GLR-AT ID + stable URL] |
> Fingerprint (SHA-256): [hash] | Issued: [date/time + timezone] |
> Method: [directly by the human principal | automatically under standing
> authorization dated November 17, 2026]
>
> Claim: [the record's claim, verbatim]

The Method line has exactly two variants, selected by the record's entry
path: direct issuance reads "directly by the human principal"; automated
issuance reads "automatically under standing authorization dated
November 17, 2026".

Below the statement, the signature block shows: printed name (D'Vaughn
House), role (principal of Glenride), date/time, the signature value, the
key ID, and the timestamp (the independent trusted timestamp where one is
on file, or a plain statement that none is on file).

### 17.1 Canonical signed payload

The Ed25519 signature covers this canonical JSON object, fixed key order,
unescaped slashes and unicode, no trailing newline:

```json
{
  "public_id": "GLR-AT-2026-XXXXXX",
  "attestable_type": "App\\Models\\Manuscript",
  "attestable_id": "<uuid or empty string>",
  "subject_kind": "report",
  "subject_title": "<title>",
  "subject_hash": "<sha-256 hex>",
  "claim": "<claim verbatim>",
  "issued_at": "<ISO 8601 with timezone offset>",
  "issuer_name": "Glenride",
  "entered_via": "manual",
  "statement": "<the full statement text>",
  "supersedes_id": null,
  "version": 1
}
```

The encoding is part of this protocol: change it only with a protocol
amendment, never silently. The timestamp token, the evidence manifest, the
challenge/revocation history, and the on-chain anchor fields are NOT in
the signed payload: the timestamp binds to the payload bytes (section 19),
and the rest are record history, protected by the chain and the anchors.

### 17.2 Federal standards followed in good faith

- FIPS 180-4 (SHA-256) for content fingerprints and chain hashes.
- FIPS 186-5 (Ed25519/EdDSA) for signatures on new issuances.
- FIPS 198-1 (HMAC) for legacy records, verified as issued.
- NIST SP 800-53 Rev. 5 AU family principles for the audit/issuance log:
  event recording, content, time stamps, protection, and retention
  (sections 10, 15, 20).
- NIST SP 800-57 principles for key management (section 18).
- RFC 3161 for independent trusted timestamping (section 19).
- 21 CFR Part 11 principles for signature meaning and linkage (printed
  name, date/time, meaning, record linkage) and for non-obscuring
  corrections (sections 17, 21) — applied as good practice to Glenride's
  own records, not as a claim that Part 11 governs them.
- FRE 902(13)/(14) principles for self-authenticating certified records
  and hash-based authentication (section 23 metadata + section 19
  timestamps).

No FIPS 140-3 validated module is in use; none is claimed.

## 18. Key management

Key management follows SP 800-57 principles, stated as Glenride actually
practices them:

- **Generation.** The keypair is generated on the issuing host with the
  platform's Ed25519 implementation (PHP sodium). Generation happens once
  per key ID, on the host, never on a developer machine, never over a
  network.
- **Storage.** The private key lives ONLY in the application environment
  on the issuing host (`ATTESTATION_SIGNING_KEY`, base64), in a file of
  mode 600, excluded from version control. It is never stored in the
  database, in a log, in an email, or in any repository.
- **Access.** Only the application process on the issuing host reads the
  key, in memory, at signing time. No human copies it. No other host,
  service, or person holds a copy.
- **No-copy rule.** The private key is never copied, printed, logged,
  emailed, pasted into chat, or transmitted anywhere, for any reason.
  A request to move or show the key is refused; rotation (below) is the
  only remedy for a key that must stop being used.
- **Binding.** The public key, its SHA-256 fingerprint, the bound identity
  ("D'Vaughn House, principal of Glenride"), the effective date, and the
  revocation procedure are published on the key statement page and in the
  signing key configuration. The binding is Glenride's published
  statement; it is NOT a certificate issued by a certificate authority,
  and the key statement page says so plainly.
- **Rotation.** To rotate: generate a new keypair on the host, add its
  public key under a new key ID, set the new key ID active, and replace
  the environment secret. Old public keys stay published (status retired)
  forever, so signatures made under them keep verifying. Records carry
  the key ID they were signed with; verification always uses the right
  public key. Rotation never re-signs old records.
- **Revocation.** If a private key is exposed, lost, or suspected
  compromised: mark the key revoked on the key statement page, rotate
  immediately, and review every attestation signed under the revoked key.
  The revoked public key stays published so the record of what it signed
  stays checkable. Revocation is a human principal act.
- **Destruction.** A retired private key is destroyed by removing it from
  the host environment and overwriting the storage that held it. No
  backup copy of any private key exists, by design.

## 19. Independent trusted timestamping

A hash chain proves relative order, not wall-clock time. Each new issuance
therefore requests an RFC 3161 timestamp token from an independent
timestamp authority (currently the free TSA at `https://freetsa.org/tsr`),
over the exact canonical bytes that were signed. The token, its stated
time, and the source are recorded on the attestation.

- **What a token proves.** The signed payload's hash existed at the
  authority's stated time, as attested by the authority named on the
  record. Combined with the signature, it binds the record's existence to
  an independent clock.
- **What it does not prove.** The truth of the record's contents, or
  anything about the signer beyond the signature itself.
- **Verification.** The token verifies offline with the committed TSA
  certificates (`resources/certs/freetsa/`), using standard OpenSSL
  timestamp verification. The command `attestations:verify-timestamp`
  reports signature, timestamp, and chain entry for one record.
- **Failure handling.** If the authority cannot be reached, issuance
  still completes and the record is marked timestamp-pending/failed; the
  daily `attestations:timestamp-missing` command retries. No timestamp is
  ever invented from the local clock and presented as independent. A
  record whose issue time is the system clock says so on its page.
- **No account, no cost.** The TSA used requires no account and charges
  nothing. If it becomes unavailable, the multi-anchor record (section 20)
  remains as the independent time witness, and the gap is reported.

## 20. Log protection and independent preservation

The issuance log (section 10) is protected in three layers:

1. **Code.** The log model refuses Eloquent updates and deletes
   (append-only guards). No code path updates or deletes a log entry.
2. **Database.** A Postgres trigger refuses UPDATE and DELETE statements
   on the issuance log table. (SQLite test runs rely on the model guards
   and on chain verification detecting tampering.)
3. **Independent preservation.** Weekly, the chain head is anchored to an
   independent public location: an anchor record (sequence, entry hash,
   public ID, issue time, chain digest, anchor time) is committed to the
   public thinktank-os repository under `docs/attestation-anchors/` and
   pushed to both remotes by a host-side script on a weekly timer. The
   public commit is the independent witness. The anchor command
   (`attestations:anchor-chain`) builds the record; the chain digest is
   SHA-256 over the concatenated entry hashes for seq 0 through the head,
   so one value binds the whole chain prefix. An anchor is verified by
   recomputing the digest from the live log and checking the entry hash.

- **Retention (AU-11).** Issuance log entries, attestation records, anchor
  files, and audit records are retained indefinitely. Nothing in this
  system deletes history to hide it: revocation is a status, correction
  is a new version, and retention has no expiry.
- **Access.** Only the application process writes to the issuance log,
  through the chain service, inside issuing transactions. No other writer
  exists. The log is readable by anyone through the verify command.

## 21. Validation, authority, accountability, and correction

### 21.1 What the gates validate

Section 6 states the six digest gates. For direct issuances, the issuer
checks the SOP intake (§4): identity, pipeline compliance where
applicable, claim support, evidence, and hash. The signature covers the
checked record; the gates and the intake check are what the signature
stands behind.

### 21.2 Who holds authority

| Act | Who | Enforced by |
|---|---|---|
| Issue (direct) | Glenride editors and orchestrators only (`canIssueAttestations`) | Controller authorization + role check, tested |
| Issue (automated, digest reports only) | The scheduled job / button, as the human principal's instrument, under the standing authorization | SOP v1.2 §10 scope; gates; same signing code |
| Challenge | Any signed-in Fellow, with stated grounds | Controller; challenge rows are permanent |
| Revoke | Glenride editors and orchestrators only | Controller authorization + role check, tested |
| Correct | Glenride editors and orchestrators only | Controller authorization + role check, tested |
| Rotate / revoke a key | The human principal | Procedure in section 18; no code path |
| Anchor the chain | The weekly host script (public data only) | Script idempotency; refusal on digest mismatch |

Issuer-account controls, as they actually are: accounts are
password-authenticated (Laravel Breeze); issuer authority is the role
check above. No multi-factor authentication is currently enforced, and
no claim is made that it is. If that changes, this section is amended
first and the code second.

### 21.3 Accountability

The human principal answers for every issuance: Glenride is the issuer of
record, acting through him, and his name is on every record. A bad
issuance is corrected in the open: challenge it, revoke it, or correct it
by supersession — never by quiet edit. The correction, the revocation,
and the challenge history stay on the public record. The system never
challenges, revokes, or corrects on its own.

### 21.4 Non-obscuring correction

- Challenge, revocation, and correction never delete or overwrite
  anything. A challenge adds a challenge row and marks the record
  challenged. A revocation sets status, time, and reason. A correction
  appends a new version (N+1) with a new public ID, linked to the
  original by `supersedes_id`, signed fresh, with its own chain entry.
- The original stays readable exactly as issued and is marked superseded
  (the superseding record's public ID is shown on its page). The
  correction's page names the record it corrects and the reason.
- A revoked record cannot be corrected: it stays revoked. A new
  attestation is issued instead when the work warrants one.
- Superseded versions are retained indefinitely and remain verifiable.
  The chain entry for the original is kept; the correction gets its own
  entry.

## 22. What "attested" means

Stated once, here, and carried in the attestation statement (section 17)
and on the registry page:

An attestation certifies the identity, origin, and integrity of the
record, plus the stated claim as published. It does not certify the truth
of third-party data the record reports. Glenride follows the named
federal standards in good faith; Glenride is not a federal agency; the
attestation is not a federal certification, and no federal agency has
endorsed it.

## 23. Identifiers, metadata, preservation, and residual items

### 23.1 Persistent identifiers

- **Attestation IDs.** `GLR-AT-YYYY-XXXXXX`: unique, never reused, stable,
  and resolvable at `/attestations/{public_id}` (HTML) and
  `/attestations/{public_id}.md` (markdown). The content hash (SHA-256)
  is the integrity identifier: it binds the record to the exact bytes.
- **Drug identifiers inside digest records.** The NDC (National Drug
  Code) is the keyed drug identifier for ontology records — the existing
  unique identifier, used as-is, with no Glenride-invented identifier.
  (Decided November 17, 2026: clarity to the public, to attestation, and
  to auditing.)
- **Key IDs.** Versioned (`glenride-ed25519-2026-11`), never reused,
  permanently published (section 18).

### 23.2 Metadata record

Every attestation carries a metadata record: title, kind, identifier,
stable URL, content hash, claim, issuer, human principal, verifier,
entry path, method, status, version, supersession link, issue time,
signature method, key ID, timestamp time and source, and revocation
details where applicable. The deposit package (below) exports exactly
this record per attestation.

### 23.3 Independent deposit

The command `attestations:deposit-package` builds a registry metadata
export (metadata JSON + README, zipped) for deposit in an independent
repository. The deposit path, documented here for the account holder:

1. Sign in to the repository account. (Zenodo is the documented path:
   it mints DOIs free, with no fee for public records.)
2. Create a record titled "Glenride attestation registry — metadata
   export <date>".
3. Upload the metadata JSON and README as the record files.
4. Publish. Record the DOI in the deposit log below.
5. Repeat monthly, or after any revocation.

No account has been created and nothing has been deposited: the deposit
step needs the human principal's repository account and approval. This is
the blocked remainder of the preservation work, reported plainly, with
the exact steps above.

**Deposit log.** (No deposits yet.)

### 23.4 Residual blocked items

- **Independent deposit.** Blocked on the human principal's repository
  account + approval. Package builder built; steps documented above.
- **Mail delivery for the run email.** Blocked on SMTP configuration
  (`MAIL_MAILER` + host/port/username/password + real from address).
  Payloads queue in the outbox meanwhile; no credentials are invented.
- **Multi-factor authentication on issuer accounts.** Not currently
  enforced; not claimed. No code change is blocked on it; the protocol
  states the fact (section 21.2).

## 24. Version history

- **1.0 — November 17, 2026.** Initial protocol. Approved with the PRD
  defaults by D'Vaughn House's tap, November 17, 2026. Human-source
  provisions, serialization scheme, email, and button included from the
  first version.
- **2.0 — November 17, 2026.** Federal alignment, ordered by D'Vaughn
  House November 17, 2026: the attestation statement above the signature
  block on every record; Ed25519 signing for new issuances with dual
  verification (legacy HMAC records verify as issued); published key
  statement and key management; RFC 3161 trusted timestamping; chain
  append for every issuance path; log protection (model guards + database
  trigger); weekly independent chain-head anchoring; non-obscuring
  correction by supersession; identifier/metadata/deposit policy; stated
  meaning of "attested"; honesty boundary and residual blocked items.
