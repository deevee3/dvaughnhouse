<?php

namespace App\Services\Attestation;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Throwable;

/**
 * Independent trusted timestamping via RFC 3161 (free TSA).
 *
 * A hash chain proves relative order, not wall-clock time. A timestamp
 * token from an independent timestamp authority proves the signed
 * payload's hash existed at the authority's stated time. The token is
 * requested over the exact canonical bytes that were signed, so the
 * token, the signature, and the record all bind to the same bytes.
 *
 * What a token proves: the payload hash existed at the stated time,
 * as attested by the timestamp authority named on the record. What it
 * does NOT prove: the truth of the record's contents, or anything
 * about the signer beyond the signature itself.
 *
 * Failure is never fatal and never invented: when the TSA cannot be
 * reached, the caller records timestamp_status 'failed' and the
 * attestations:timestamp-missing command retries later. No timestamp
 * is ever fabricated from the local clock and presented as independent.
 *
 * The TSA's CA certificate and TSA certificate are public material,
 * committed under resources/certs/freetsa/, so verification never
 * depends on fetching trust material at check time.
 */
class TrustedTimestampService
{
    private ?string $lastError = null;

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function enabled(): bool
    {
        return (bool) config('attestation.timestamp_enabled', true);
    }

    /**
     * Request an RFC 3161 timestamp token for the given payload bytes.
     *
     * @return null|array{token: string, time: Carbon, source: string}
     *         token is base64 DER; time is the authority's stated time.
     */
    public function requestFor(string $payload): ?array
    {
        $this->lastError = null;

        if (! $this->enabled()) {
            $this->lastError = 'Trusted timestamping is disabled by configuration.';

            return null;
        }

        $url = (string) config('attestation.tsa_url', 'https://freetsa.org/tsr');
        $dir = sys_get_temp_dir().'/glenride-ts-'.uniqid('', true);

        try {
            if (! mkdir($dir, 0700, true) && ! is_dir($dir)) {
                $this->lastError = 'Could not create a temporary directory for the timestamp request.';

                return null;
            }

            $dataFile = $dir.'/payload.bin';
            $queryFile = $dir.'/query.tsq';
            $tokenFile = $dir.'/token.tsr';
            file_put_contents($dataFile, $payload);

            $query = Process::timeout(30)->run([
                'openssl', 'ts', '-query',
                '-data', $dataFile,
                '-sha256', '-cert',
                '-out', $queryFile,
            ]);

            if (! $query->successful() || ! is_file($queryFile)) {
                $this->lastError = 'Could not build the RFC 3161 timestamp request.';

                return null;
            }

            $response = Http::timeout(30)
                ->withBody((string) file_get_contents($queryFile), 'application/timestamp-query')
                ->post($url);

            if (! $response->successful()) {
                $this->lastError = "Timestamp authority did not answer successfully (HTTP {$response->status()}).";

                return null;
            }

            file_put_contents($tokenFile, $response->body());

            $time = $this->tokenTime($tokenFile);

            if ($time === null) {
                $this->lastError = 'The timestamp authority returned a token whose time could not be read.';

                return null;
            }

            return [
                'token' => base64_encode($response->body()),
                'time' => $time,
                'source' => $url,
            ];
        } catch (Throwable $e) {
            $this->lastError = 'Timestamp request failed: '.$e->getMessage();

            return null;
        } finally {
            $this->removeDir($dir);
        }
    }

    /**
     * Verify a stored token against the payload bytes it timestamps.
     * Uses the committed TSA certificates; needs no network access.
     */
    public function verify(string $payload, string $tokenBase64): bool
    {
        $token = base64_decode($tokenBase64, true);

        if ($token === false || $token === '') {
            return false;
        }

        $cacert = (string) config('attestation.tsa_cacert', '');
        $tsaCert = (string) config('attestation.tsa_cert', '');

        if (! is_file($cacert) || ! is_file($tsaCert)) {
            return false;
        }

        $dir = sys_get_temp_dir().'/glenride-tsv-'.uniqid('', true);

        try {
            if (! mkdir($dir, 0700, true) && ! is_dir($dir)) {
                return false;
            }

            $dataFile = $dir.'/payload.bin';
            $tokenFile = $dir.'/token.tsr';
            file_put_contents($dataFile, $payload);
            file_put_contents($tokenFile, $token);

            $result = Process::timeout(30)->run([
                'openssl', 'ts', '-verify',
                '-data', $dataFile,
                '-in', $tokenFile,
                '-CAfile', $cacert,
                '-untrusted', $tsaCert,
            ]);

            return str_contains($result->output().$result->errorOutput(), 'Verification: OK');
        } catch (Throwable) {
            return false;
        } finally {
            $this->removeDir($dir);
        }
    }

    /**
     * Read the authority's stated time out of a token file.
     */
    private function tokenTime(string $tokenFile): ?Carbon
    {
        $reply = Process::timeout(30)->run(['openssl', 'ts', '-reply', '-in', $tokenFile, '-text']);

        if (! $reply->successful()) {
            return null;
        }

        if (! preg_match('/Time stamp:\s*(.+)/', $reply->output(), $m)) {
            return null;
        }

        try {
            return Carbon::parse(trim($m[1]), 'UTC');
        } catch (Throwable) {
            return null;
        }
    }

    private function removeDir(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        foreach (glob($dir.'/*') ?: [] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }

        rmdir($dir);
    }
}
