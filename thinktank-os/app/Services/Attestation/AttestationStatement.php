<?php

namespace App\Services\Attestation;

use App\Models\Attestation;
use App\Support\SiteConfig;
use Carbon\Carbon;

/**
 * The attestation statement that accompanies EVERY attested artifact,
 * placed ABOVE the signature block.
 *
 * The wording below is fixed: it is the statement D'Vaughn House
 * approved on November 17, 2026. Only the bracketed fields vary per
 * record. Do not paraphrase it, and do not change it without a protocol
 * amendment. The statement is rendered deterministically from the
 * record's stored fields, so the displayed statement always matches
 * the record — and for Ed25519 records the statement text is inside
 * the signed payload, so tampering with any field it carries breaks
 * verification.
 *
 * Meaning of "attested" (stated here, in the protocol, and on the
 * registry page): the attestation certifies the identity, origin, and
 * integrity of the record, plus the stated claim as published. It does
 * NOT certify the truth of third-party data the record reports. It is
 * NOT a federal certification, and no federal agency has endorsed it.
 */
class AttestationStatement
{
    public const HUMAN_PRINCIPAL_NAME = "D'Vaughn House";

    public const HUMAN_PRINCIPAL_ROLE = 'principal of Glenride';

    public const STANDING_AUTHORIZATION_DATE = 'November 17, 2026';

    /**
     * The method phrase for the Method line, selected by entry path.
     * Only two variants exist.
     */
    public static function methodPhrase(string $enteredVia): string
    {
        return $enteredVia === 'automated'
            ? 'automatically under standing authorization dated '.self::STANDING_AUTHORIZATION_DATE
            : 'directly by the human principal';
    }

    /**
     * Render the statement for a stored attestation record.
     * Display-only for already-issued records: this never changes
     * any stored field or signed byte.
     */
    public static function render(Attestation $attestation): string
    {
        return self::renderFromFields(
            subjectTitle: (string) $attestation->subject_title,
            subjectKind: (string) $attestation->subject_kind,
            publicId: (string) $attestation->public_id,
            stableUrl: SiteConfig::canonical('/attestations/'.$attestation->public_id),
            subjectHash: (string) $attestation->subject_hash,
            issuedAt: $attestation->issued_at,
            enteredVia: (string) $attestation->entered_via,
            claim: (string) $attestation->claim,
        );
    }

    /**
     * Render the statement from explicit fields. Used at signing time
     * (before the record exists) and at verification time (from the
     * stored record). The two renderings must be byte-identical for
     * the same field values — that is what binds the statement to
     * the signature.
     */
    public static function renderFromFields(
        string $subjectTitle,
        string $subjectKind,
        string $publicId,
        string $stableUrl,
        string $subjectHash,
        Carbon $issuedAt,
        string $enteredVia,
        string $claim,
    ): string {
        $paragraphs = [
            'ATTESTATION STATEMENT',
            "I, D'Vaughn House, principal of Glenride, attest the following about the artifact identified below. This record is the exact artifact described: its contents match the fingerprint shown. It was issued by Glenride, through me as human principal, on the date and time shown. The claim stated below reflects the record as published, verified through the checks named in the Glenride attestation protocol.",
            'This attestation certifies the identity, origin, and integrity of this record. It does not certify the truth of third-party data the record reports.',
            'Glenride follows the federal standards named in its attestation protocol in good faith. Glenride is not a federal agency. This attestation is not a federal certification, and no federal agency has endorsed it.',
            'Artifact: '.$subjectTitle.' | Kind: '.$subjectKind.' | Identifier: '.$publicId.' — '.$stableUrl.' | Fingerprint (SHA-256): '.$subjectHash.' | Issued: '.self::formatIssuedAt($issuedAt).' | Method: '.self::methodPhrase($enteredVia),
            'Claim: '.$claim,
        ];

        return implode("\n\n", $paragraphs);
    }

    /**
     * The signature block shown BELOW the statement: printed name, role,
     * date/time, signature value, key ID, and timestamp. For records
     * with an independent trusted timestamp, the timestamp line names
     * the timestamp authority; otherwise it says plainly that no
     * independent timestamp is on file.
     *
     * @return array{printed_name: string, role: string, date_time: string, signature_value: string, signature_method: string, key_id: string, timestamp: string}
     */
    public static function signatureBlock(Attestation $attestation): array
    {
        $method = (string) ($attestation->signature_method ?: SigningKeyService::METHOD_HMAC);

        return [
            'printed_name' => self::HUMAN_PRINCIPAL_NAME,
            'role' => self::HUMAN_PRINCIPAL_ROLE,
            'date_time' => self::formatIssuedAt($attestation->issued_at),
            'signature_value' => (string) $attestation->signature,
            'signature_method' => $method,
            'key_id' => (string) ($attestation->key_id ?: ($method === SigningKeyService::METHOD_ED25519 ? 'unknown' : 'legacy-hmac (application key)')),
            'timestamp' => self::timestampLine($attestation),
        ];
    }

    /**
     * Date/time with timezone, deterministic from the stored instant:
     * Eastern time for reading, ISO 8601 for checking.
     */
    public static function formatIssuedAt(Carbon $issuedAt): string
    {
        $eastern = $issuedAt->copy()->setTimezone('America/New_York');

        return $eastern->format('F j, Y, g:i:s A T').' ('.$issuedAt->format('c').')';
    }

    private static function timestampLine(Attestation $attestation): string
    {
        if ($attestation->timestamped_at && $attestation->timestamp_source) {
            return 'RFC 3161 trusted timestamp: '.self::formatIssuedAt($attestation->timestamped_at->copy()).' — source: '.$attestation->timestamp_source;
        }

        if (($attestation->timestamp_status ?? null) === 'failed') {
            return 'No independent timestamp: the timestamp authority could not be reached at issuance; the issue time above is the system clock. A retry is pending.';
        }

        if (($attestation->timestamp_status ?? null) === 'pending') {
            return 'Independent timestamp pending: the issue time above is the system clock until the timestamp authority responds.';
        }

        return 'No independent timestamp on file for this record: the issue time above is the system clock.';
    }
}
