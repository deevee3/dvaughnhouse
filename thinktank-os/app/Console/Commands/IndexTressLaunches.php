<?php

namespace App\Console\Commands;

use App\Services\PlusIndexer\TressIndexer;
use Illuminate\Console\Command;

class IndexTressLaunches extends Command
{
    protected $signature = 'tress:index-launches';

    protected $description = 'Index Tress Column launches from Base Sepolia into Postgres (reorg-safe, latest - 12).';

    public function handle(TressIndexer $indexer): int
    {
        $result = $indexer->run();

        if (! ($result['ok'] ?? false)) {
            $this->error($result['error'] ?? 'Indexer failed.');
            return self::FAILURE;
        }

        $this->info($result['note'] ?? 'Indexed '.$result['indexed'].' launch(es).');
        $this->info('Scanned to block '.$result['to'].'. Latest seen: '.$result['latest'].'.');

        return self::SUCCESS;
    }
}
