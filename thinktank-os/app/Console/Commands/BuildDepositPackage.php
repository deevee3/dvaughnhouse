<?php

namespace App\Console\Commands;

use App\Models\Attestation;
use App\Support\SiteConfig;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

/**
 * Build an independent-deposit package: a registry metadata export
 * (one metadata record per attestation, plus the chain anchor file
 * and a README with the deposit steps) zipped for upload to an
 * independent repository.
 *
 * This command prepares the package ONLY. It creates no account and
 * deposits nothing: the deposit step needs D'Vaughn House's account
 * and approval. See ATTESTATION-PROTOCOL.md §23 for the exact
 * deposit steps (Zenodo path documented there).
 */
class BuildDepositPackage extends Command
{
    protected $signature = 'attestations:deposit-package';

    protected $description = 'Build an independent-deposit package (registry metadata export) without creating any account or depositing anything';

    public function handle(): int
    {
        $attestations = Attestation::query()->orderBy('issued_at')->get();

        $records = $attestations->map(function (Attestation $a) {
            return [
                'identifier' => $a->public_id,
                'url' => SiteConfig::canonical('/attestations/'.$a->public_id),
                'title' => $a->subject_title,
                'kind' => $a->subject_kind,
                'subject_hash_sha256' => $a->subject_hash,
                'claim' => $a->claim,
                'issuer' => $a->issuer_name,
                'human_principal' => "D'Vaughn House, principal of Glenride",
                'verifier_id' => $a->verifier_id,
                'entered_via' => $a->entered_via,
                'method' => $a->method,
                'status' => $a->status,
                'version' => $a->version ?? 1,
                'supersedes_public_id' => $a->supersedes?->public_id,
                'issued_at' => $a->issued_at->format('c'),
                'signature_method' => $a->signature_method ?: 'hmac-sha256',
                'key_id' => $a->key_id,
                'timestamped_at' => $a->timestamped_at?->format('c'),
                'timestamp_source' => $a->timestamp_source,
                'revoked_at' => $a->revoked_at?->format('c'),
                'revocation_reason' => $a->revocation_reason,
            ];
        })->all();

        $date = now()->format('Y-m-d');
        $dir = "deposit-packages/{$date}";
        $disk = Storage::disk('local');
        $disk->put("{$dir}/registry-metadata.json", json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
        $disk->put("{$dir}/README.md", $this->readme($date, count($records)));

        $zipPath = "deposit-packages/attestation-registry-{$date}.zip";

        if (class_exists(ZipArchive::class)) {
            $zipFullPath = $disk->path($zipPath);

            $zip = new ZipArchive;
            $zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            $zip->addFile($disk->path("{$dir}/registry-metadata.json"), 'registry-metadata.json');
            $zip->addFile($disk->path("{$dir}/README.md"), 'README.md');
            $zip->close();

            $this->info('Deposit package built: '.count($records).' metadata records in '.$zipPath.'.');
        } else {
            $this->info('Deposit package built: '.count($records).' metadata records in '.$dir.'/ (zip extension unavailable, files left unzipped).');
        }
        $this->info('NOT deposited: the deposit step needs D\'Vaughn House\'s repository account and approval. See ATTESTATION-PROTOCOL.md §23 for the exact steps.');

        return self::SUCCESS;
    }

    private function readme(string $date, int $count): string
    {
        return <<<MD
        # Glenride attestation registry — independent-deposit package

        Built: {$date}. Records: {$count}.

        This package is a metadata export of the Glenride attestation
        registry, prepared for deposit in an independent repository so
        the registry survives independently of Glenride's own systems.
        It contains metadata only: identifiers, stable URLs, content
        hashes, claims, issuers, dates, signature methods, and key IDs.
        It contains no private keys and no unpublished content.

        Glenride follows the named federal standards in its attestation
        protocol in good faith. Glenride is not a federal agency. No
        federal agency has endorsed any attestation in this package.

        ## Deposit steps (need the repository account holder)

        1. Sign in to the repository account (Zenodo path is documented
           in ATTESTATION-PROTOCOL.md §23; Zenodo mints DOIs free).
        2. Create a new record titled "Glenride attestation registry —
           metadata export {$date}".
        3. Upload registry-metadata.json (and this README) as the record
           files.
        4. Publish. Record the DOI back in the protocol's deposit log.
        5. Repeat on a monthly cadence, or after any revocation.

        ## Verification

        Each record's `subject_hash_sha256` is the SHA-256 of the
        attested artifact's bytes. Each record's `url` resolves to the
        public attestation page, which recomputes the signature from
        the stored record. Ed25519 records verify from the published
        public key on the key statement page.
        MD;
    }
}
