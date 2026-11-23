<?php

namespace App\Console\Commands;

use App\Services\Attestation\ChainAnchorService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AnchorIssuanceChain extends Command
{
    protected $signature = 'attestations:anchor-chain
        {--print : Print the anchor JSON to stdout instead of writing a file (for the host-side publish script)}
        {--path= : Write the anchor JSON to this storage path instead of the default}';

    protected $description = 'Anchor the attestation issuance chain head to an independent public location (anchor record for the public repository)';

    public function handle(ChainAnchorService $anchors): int
    {
        $anchor = $anchors->buildAnchor();

        if ($anchor === null) {
            $this->info('Issuance chain is empty: nothing to anchor.');

            return self::SUCCESS;
        }

        $json = json_encode($anchor, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";

        if ($this->option('print')) {
            $this->line($json);

            return self::SUCCESS;
        }

        $path = $this->option('path')
            ?: 'attestation-anchors/anchor-'.now()->format('Y-m-d').'-seq-'.$anchor['seq'].'.json';

        Storage::disk('local')->put($path, $json);

        $this->info("Chain head anchored: seq {$anchor['seq']}, public_id {$anchor['public_id']}, digest {$anchor['chain_digest']}. Wrote {$path}.");

        return self::SUCCESS;
    }
}
