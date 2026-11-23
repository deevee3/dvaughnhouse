<?php

namespace App\Console\Commands;

use App\Services\Attestation\IssuanceChainService;
use Illuminate\Console\Command;

class VerifyIssuanceChain extends Command
{
    protected $signature = 'attestations:verify-chain';

    protected $description = 'Recompute the attestation issuance hash chain from genesis and report any gap, break, or tamper';

    public function handle(IssuanceChainService $chain): int
    {
        $result = $chain->verify();

        if ($result['empty']) {
            $this->info('Issuance chain is empty: no entries yet. Nothing to verify.');

            return self::SUCCESS;
        }

        if ($result['valid']) {
            $this->info("Issuance chain VALID: {$result['entries']} entries, seq 0..{$result['last_seq']}, no gaps, no breaks.");

            return self::SUCCESS;
        }

        $this->error("Issuance chain INVALID: {$result['entries']} entries, seq 0..{$result['last_seq']}.");

        foreach ($result['errors'] as $error) {
            $this->error('  - '.$error);
        }

        return self::FAILURE;
    }
}
