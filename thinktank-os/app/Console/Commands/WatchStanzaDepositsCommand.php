<?php

namespace App\Console\Commands;

use App\Jobs\WatchStanzaDeposits;
use Illuminate\Console\Command;

class WatchStanzaDepositsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'credits:watch-deposits';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run one STANZA deposit watcher pass (credit accounts from on-chain deposits)';

    /**
     * Execute the console command.
     *
     * Runs a single watcher pass synchronously. Schedule this command
     * (e.g. every few minutes) or dispatch the WatchStanzaDeposits job
     * from the scheduler — the pass itself is idempotent and defensive.
     */
    public function handle(): int
    {
        if (! config('credits.watcher_enabled')) {
            $this->info('Deposit watcher is disabled (CREDITS_WATCHER_ENABLED=false). No pass run.');

            return self::SUCCESS;
        }

        WatchStanzaDeposits::dispatchSync();

        $this->info('Deposit watcher pass complete. See the log for deposits credited or skipped.');

        return self::SUCCESS;
    }
}
