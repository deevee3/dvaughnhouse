// Start a launch: Configure, Lock, Prove.
//
// The form collects every LaunchParams field in plain language. Guards
// mirror the on-chain validation rules and name the exact field and
// the fix. A launch is two transactions, stated plainly: Part 1
// deploys, Part 2 launches, and nothing is live until Part 2
// confirms. An orphaned Part 1 is resumable and labeled.
//
// The quote side (quoteIsCurrency0) is set after step 1, once the
// token address exists: it compares the quote asset address with the
// real token address. Part 1 never uses the value, so step 1 runs
// with a placeholder and step 2 runs with the computed value.

import { Children, cloneElement, useEffect, useId, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    AIRDROP_CAMPAIGN_FEE_WEI,
    CHAIN_ID,
    CHAIN_NAME,
    DISTRIBUTION_FACTORY,
    FEE_TIERS,
    HOOK_CERTIFICATE_FACTORY,
    MIN_TIMED_LOCK_DAYS,
    QUOTE_ASSETS,
    SELECTORS,
    TOPICS,
    USD_GATE_UNITS,
    explorerTx,
} from '../tressConfig';
import {
    decodeLaunchedLog,
    ethEstimateGas,
    ethGasPrice,
    readAddress,
    readTokenMeta,
} from '../rpc';
import { dryRunDeploy, dryRunLaunch, encodeDeployCalldata, encodeLaunchCalldata } from '../abi';
import { usePart1Status } from '../useChain';
import { useWallet } from '../useWallet';
import {
    recordTx,
    sendWalletTransaction,
    waitForReceipt,
} from '../wallet';
import { formatEth, formatTokenAmount, formatUsdGate, isZeroAddress, parseTokenAmount } from '../format';
import { ErrorFix } from './primitives';
import { tcUrl, tradeUrl } from '../urls';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_ROOT = `0x${'0'.repeat(64)}`;

const EMPTY_FORM = {
    name: '',
    symbol: '',
    totalSupply: '1000000',
    creator: '',
    quoteChoice: QUOTE_ASSETS[0].address,
    quoteCustom: '',
    poolFeeTier: 3000,
    quoteUsdPrice: '',
    volumeThresholdQuote: '',
    lockMode: 0,
    lockDurationDays: String(MIN_TIMED_LOCK_DAYS),
    lpFeeMode: 0,
    vestingPct: '0',
    airdropPct: '0',
    liquidityPct: '100',
    vestingBeneficiary: '',
    vestingCliffDays: '0',
    vestingDurationDays: '365',
    airdropMerkleRoot: '',
    liquidityAllocation: '',
    walletCapTokens: '0',
    walletCapBlocks: '0',
    maxSwapQuote: '0',
    maxSwapBlocks: '0',
};

function storageKey(wallet) {
    return `tc.part1.${CHAIN_ID}.${wallet.toLowerCase()}`;
}

function loadStoredPart1(wallet) {
    if (!wallet) return null;
    try {
        const raw = window.localStorage.getItem(storageKey(wallet));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveStoredPart1(wallet, record) {
    try {
        window.localStorage.setItem(storageKey(wallet), JSON.stringify(record));
    } catch {
        // Storage blocked: the chain record stays the source of truth.
    }
}

function clearStoredPart1(wallet) {
    try {
        window.localStorage.removeItem(storageKey(wallet));
    } catch {
        // See saveStoredPart1.
    }
}

function isAddress(value) {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function isRoot(value) {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

function toChainParams(form, quote, tokenAddress) {
    const vestingBps = Math.round(Number(form.vestingPct) * 100);
    const airdropBps = Math.round(Number(form.airdropPct) * 100);
    const liquidityBps = Math.round(Number(form.liquidityPct) * 100);
    return {
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        totalSupply: parseTokenAmount(form.totalSupply, 18),
        creator: form.creator.trim().toLowerCase(),
        quoteAsset: quote.address.toLowerCase(),
        poolFeeTier: Number(form.poolFeeTier),
        volumeThresholdQuote: parseTokenAmount(form.volumeThresholdQuote, quote.decimals),
        usdGate: USD_GATE_UNITS,
        lockMode: Number(form.lockMode),
        lockDurationSeconds:
            Number(form.lockMode) === 0 ? 0n : BigInt(Number(form.lockDurationDays) * 86400),
        lpFeeMode: Number(form.lpFeeMode),
        vestingBps,
        airdropBps,
        liquidityBps,
        vestingBeneficiary:
            vestingBps > 0 ? form.vestingBeneficiary.trim().toLowerCase() : ZERO_ADDRESS,
        vestingCliffSeconds: BigInt(Number(form.vestingCliffDays) * 86400),
        vestingDurationSeconds: BigInt(Number(form.vestingDurationDays) * 86400),
        airdropMerkleRoot:
            airdropBps > 0 ? form.airdropMerkleRoot.trim().toLowerCase() : ZERO_ROOT,
        liquidityAllocation: form.liquidityAllocation.trim().toLowerCase(),
        quoteIsCurrency0: tokenAddress
            ? quote.address.toLowerCase() < tokenAddress.toLowerCase()
            : false,
        walletCapAmount: parseTokenAmount(form.walletCapTokens, 18),
        walletCapBlocks: BigInt(Number(form.walletCapBlocks)),
        maxSwapQuoteAmount: parseTokenAmount(form.maxSwapQuote, quote.decimals),
        maxSwapBlocks: BigInt(Number(form.maxSwapBlocks)),
    };
}

function validateForm(form, quote) {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is empty. Give the token a name.';
    if (!form.symbol.trim()) errors.symbol = 'Symbol is empty. Give the token a symbol.';
    const supply = parseTokenAmount(form.totalSupply, 18);
    if (supply === null || supply === 0n) {
        errors.totalSupply = 'Total supply must be a number above zero.';
    }
    if (!isAddress(form.creator)) errors.creator = 'Creator must be a 0x address.';
    if (!quote) errors.quoteChoice = 'Pick a quote asset, or enter a token address.';
    const threshold = quote ? parseTokenAmount(form.volumeThresholdQuote, quote.decimals) : null;
    if (threshold === null || threshold === 0n) {
        errors.volumeThresholdQuote =
            'Gate threshold must be a number above zero, in quote units.';
    }
    const vesting = Number(form.vestingPct);
    const airdrop = Number(form.airdropPct);
    const liquidity = Number(form.liquidityPct);
    if (
        !Number.isInteger(vesting) ||
        !Number.isInteger(airdrop) ||
        !Number.isInteger(liquidity) ||
        vesting < 0 ||
        airdrop < 0 ||
        liquidity < 0
    ) {
        errors.split = 'Splits must be whole percents, zero or above.';
    } else if (vesting + airdrop + liquidity !== 100) {
        errors.split = `Splits add to ${vesting + airdrop + liquidity}%. They must add to exactly 100%.`;
    }
    if (Number(form.lockMode) === 1) {
        const days = Number(form.lockDurationDays);
        if (!Number.isInteger(days) || days < MIN_TIMED_LOCK_DAYS) {
            errors.lockDurationDays = `A timed lock needs at least ${MIN_TIMED_LOCK_DAYS} days.`;
        }
    }
    if (vesting > 0) {
        if (!isAddress(form.vestingBeneficiary)) {
            errors.vestingBeneficiary =
                'Vesting is used, so a beneficiary address is required.';
        }
        const cliff = Number(form.vestingCliffDays);
        const duration = Number(form.vestingDurationDays);
        if (!Number.isInteger(duration) || duration <= 0) {
            errors.vestingDurationDays = 'Vesting needs a duration above zero days.';
        } else if (!Number.isInteger(cliff) || cliff < 0 || cliff > duration) {
            errors.vestingCliffDays = 'The cliff must be between zero and the duration.';
        }
    }
    if (airdrop > 0 && !isRoot(form.airdropMerkleRoot)) {
        errors.airdropMerkleRoot =
            'An airdrop is used, so a Merkle root is required: 0x plus 64 hex characters.';
    }
    if (!isAddress(form.liquidityAllocation)) {
        errors.liquidityAllocation = 'Liquidity allocation must be a 0x address.';
    }
    if (parseTokenAmount(form.walletCapTokens, 18) === null) {
        errors.walletCapTokens = 'Wallet cap must be a number. Zero turns the cap off.';
    }
    if (!/^\d+$/.test(form.walletCapBlocks.trim())) {
        errors.walletCapBlocks = 'Wallet cap window must be a whole number of blocks.';
    }
    if (quote && parseTokenAmount(form.maxSwapQuote, quote.decimals) === null) {
        errors.maxSwapQuote = 'Max swap size must be a number. Zero turns the guard off.';
    }
    if (!/^\d+$/.test(form.maxSwapBlocks.trim())) {
        errors.maxSwapBlocks = 'Max swap window must be a whole number of blocks.';
    }
    return errors;
}

function Field({ label, help, error, children }) {
    const id = useId();
    return (
        <div className="tc-field">
            <label htmlFor={id}>{label}</label>
            {Children.map(children, (child) => cloneElement(child, { id }))}
            {help && <p className="tc-field-help">{help}</p>}
            {error && <p className="tc-field-error">{error}</p>}
        </div>
    );
}

export function LaunchFlow() {
    const wallet = useWallet();
    const part1 = usePart1Status();
    const [form, setForm] = useState(EMPTY_FORM);
    const [step, setStep] = useState('configure');
    const [errors, setErrors] = useState({});
    const [typed, setTyped] = useState('');
    const [quoteMeta, setQuoteMeta] = useState(null);
    const [quoteError, setQuoteError] = useState(null);
    const [deployState, setDeployState] = useState({ status: 'idle' });
    const [launchState, setLaunchState] = useState({ status: 'idle' });
    const [estimate, setEstimate] = useState(null);
    const [estimate2, setEstimate2] = useState(null);
    const [dryRun, setDryRun] = useState(null);
    const [stored, setStored] = useState(null);
    const [launched, setLaunched] = useState(null);

    const quote = useMemo(() => {
        if (form.quoteChoice === 'other') return quoteMeta;
        return QUOTE_ASSETS.find((q) => q.address === form.quoteChoice) || null;
    }, [form.quoteChoice, quoteMeta]);

    // Defaults from the connected wallet, once.
    useEffect(() => {
        if (!wallet.address) return;
        setForm((f) => ({
            ...f,
            creator: f.creator || wallet.address,
            liquidityAllocation: f.liquidityAllocation || wallet.address,
        }));
        const found = loadStoredPart1(wallet.address);
        if (found) setStored(found);
    }, [wallet.address]);

    // Gate conversion helper: threshold from the quote price in USD.
    useEffect(() => {
        if (!quote || form.quoteUsdPrice.trim() === '') return;
        const price = Number(form.quoteUsdPrice);
        if (!Number.isFinite(price) || price <= 0) return;
        const scale = 10n ** BigInt(quote.decimals);
        const priceScaled = parseTokenAmount(form.quoteUsdPrice, 6);
        if (priceScaled === null || priceScaled === 0n) return;
        const threshold = (10000000n * 1000000n * scale) / priceScaled;
        setForm((f) => ({ ...f, volumeThresholdQuote: formatTokenAmount(threshold, quote.decimals) }));
    }, [form.quoteUsdPrice, quote]);

    // Custom quote asset: read name, symbol, decimals from the chain.
    useEffect(() => {
        if (form.quoteChoice !== 'other') {
            setQuoteMeta(null);
            setQuoteError(null);
            return undefined;
        }
        if (!isAddress(form.quoteCustom)) {
            setQuoteMeta(null);
            setQuoteError(null);
            return undefined;
        }
        let alive = true;
        readTokenMeta(form.quoteCustom.trim().toLowerCase())
            .then((meta) => {
                if (!alive) return;
                setQuoteMeta({ address: form.quoteCustom.trim().toLowerCase(), ...meta });
                setQuoteError(null);
            })
            .catch(() => {
                if (!alive) return;
                setQuoteMeta(null);
                setQuoteError('No token contract answered at this address on Base Sepolia.');
            });
        return () => {
            alive = false;
        };
    }, [form.quoteChoice, form.quoteCustom]);

    const set = (key) => (event) => {
        const value = event.target.value;
        setForm((f) => ({ ...f, [key]: value }));
    };

    const part1Used = part1.data?.deployed === true;
    const part1Launched = part1.data?.launched === true;
    const resumeAvailable =
        part1Used && !part1Launched && stored && stored.part1 === DISTRIBUTION_FACTORY.toLowerCase();

    const airdropOn = Number(form.airdropPct) > 0;
    const deployValue = airdropOn ? AIRDROP_CAMPAIGN_FEE_WEI : 0n;

    const goReview = () => {
        const found = validateForm(form, quote);
        setErrors(found);
        if (Object.keys(found).length === 0) setStep('lock');
    };

    const runDeployDryRun = async () => {
        if (!wallet.address || !quote) return;
        setDryRun({ status: 'running' });
        try {
            const params = toChainParams(form, quote, null);
            const result = await dryRunDeploy(params, wallet.address, deployValue);
            const gas = await ethEstimateGas({
                to: DISTRIBUTION_FACTORY,
                from: wallet.address,
                data: encodeDeployCalldata(params),
                value: `0x${deployValue.toString(16)}`,
            });
            const gasPrice = await ethGasPrice();
            setDryRun({ status: 'passed', result });
            setEstimate({ gas, cost: gas * gasPrice });
        } catch (err) {
            setDryRun({ status: 'failed', message: err.message });
        }
    };

    useEffect(() => {
        if (step === 'lock' && wallet.address && quote && !resumeAvailable) {
            runDeployDryRun();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Step 2 gas estimate, only once step 1 has a token address. The
    // review screen cannot estimate step 2: no token exists yet. The
    // step 2 screen shows the live estimate here.
    const step2Token =
        part1.data?.token && !isZeroAddress(part1.data.token) ? part1.data.token : null;
    useEffect(() => {
        if (step !== 'lock-part2' || !stored || !quote || !step2Token || !wallet.address) return undefined;
        let alive = true;
        setEstimate2(null);
        (async () => {
            try {
                const params = toChainParams(stored.form, quote, step2Token);
                const gas = await ethEstimateGas({
                    to: HOOK_CERTIFICATE_FACTORY,
                    from: wallet.address,
                    data: encodeLaunchCalldata(stored.part1, params),
                });
                const gasPrice = await ethGasPrice();
                if (alive) setEstimate2({ gas, cost: gas * gasPrice });
            } catch {
                if (alive) setEstimate2({ failed: true });
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, stored?.deployTx, step2Token, wallet.address]);

    const sendDeploy = async () => {
        if (!wallet.address || !quote) return;
        if (typed.trim() !== form.symbol.trim()) return;
        setDeployState({ status: 'sending' });
        try {
            const params = toChainParams(form, quote, null);
            const data = encodeDeployCalldata(params);
            const hash = await sendWalletTransaction({
                from: wallet.address,
                to: DISTRIBUTION_FACTORY,
                data,
                valueWei: deployValue,
            });
            recordTx({
                hash,
                kind: 'launch-part-1',
                label: `Step 1: deploy ${form.symbol.trim()}`,
                from: wallet.address,
                to: DISTRIBUTION_FACTORY,
            });
            // Save the resume record now, before the receipt arrives, so
            // a refresh or a slow confirmation never loses the params.
            // The resume path checks Part 1 live, so a premature record
            // is harmless. A reverted deploy clears it below.
            const record = {
                version: 1,
                wallet: wallet.address,
                part1: DISTRIBUTION_FACTORY.toLowerCase(),
                deployTx: hash,
                deployAt: Date.now(),
                form: { ...form },
            };
            saveStoredPart1(wallet.address, record);
            setStored(record);
            setDeployState({ status: 'confirming', hash });
            const receipt = await waitForReceipt(hash);
            if (!receipt) {
                setDeployState({
                    status: 'unknown',
                    hash,
                    message: 'No receipt arrived within two minutes. The transaction may still confirm. Check the explorer.',
                });
                return;
            }
            if (receipt.status !== '0x1') {
                clearStoredPart1(wallet.address);
                setStored(null);
                setDeployState({ status: 'failed', hash, message: 'The transaction failed on chain. No token was deployed. The gas is spent.' });
                return;
            }
            part1.retry();
            setDeployState({ status: 'done', hash });
            setStep('lock-part2');
        } catch (err) {
            setDeployState({ status: 'failed', message: err.message });
        }
    };

    const sendLaunch = async () => {
        if (!wallet.address || !quote || !stored) return;
        setLaunchState({ status: 'sending' });
        try {
            // Fresh read: the hook snapshot may predate step 1.
            const tokenAddress = await readAddress(DISTRIBUTION_FACTORY, SELECTORS.part1Token);
            const params = toChainParams(stored.form, quote, tokenAddress);
            const dry = await dryRunLaunch(stored.part1, params, wallet.address);
            const data = encodeLaunchCalldata(stored.part1, params);
            const hash = await sendWalletTransaction({
                from: wallet.address,
                to: HOOK_CERTIFICATE_FACTORY,
                data,
                valueWei: 0n,
            });
            recordTx({
                hash,
                kind: 'launch-part-2',
                label: `Step 2: launch ${stored.form.symbol.trim()}`,
                from: wallet.address,
                to: HOOK_CERTIFICATE_FACTORY,
            });
            setLaunchState({ status: 'confirming', hash });
            const receipt = await waitForReceipt(hash);
            if (!receipt) {
                setLaunchState({
                    status: 'unknown',
                    hash,
                    message: 'No receipt arrived within two minutes. The transaction may still confirm. Check the explorer.',
                });
                return;
            }
            if (receipt.status !== '0x1') {
                setLaunchState({ status: 'failed', hash, message: 'The transaction failed on chain. Step 1 stays deployed and resumable. The gas is spent.' });
                return;
            }
            const launchedLog = (receipt.logs || [])
                .filter(
                    (log) =>
                        log.address?.toLowerCase() ===
                            HOOK_CERTIFICATE_FACTORY.toLowerCase() &&
                        log.topics?.[0] === TOPICS.launched,
                )
                .map((log) => decodeLaunchedLog(log))
                .find(Boolean);
            clearStoredPart1(wallet.address);
            setStored(null);
            setLaunched({ hash, log: launchedLog || null, dry });
            setLaunchState({ status: 'done', hash });
            setStep('prove');
        } catch (err) {
            setLaunchState({ status: 'failed', message: err.message });
        }
    };

    const resume = () => {
        if (!stored) return;
        setForm({ ...EMPTY_FORM, ...stored.form });
        setStep('lock-part2');
        setDeployState({ status: 'done', hash: stored.deployTx });
    };

    const splitSum = Number(form.vestingPct || 0) + Number(form.airdropPct || 0) + Number(form.liquidityPct || 0);
    const tier = FEE_TIERS.find((t) => t.fee === Number(form.poolFeeTier));

    if (part1.loading) {
        return <p className="tc-loading-line">Loading launch state.</p>;
    }
    if (part1.error) {
        return (
            <ErrorFix
                title="The chain read failed."
                fix="Check the network and try again."
                onRetry={part1.retry}
            />
        );
    }

    // The shared Part 1 already ran, and this wallet has no stored
    // record to resume from. A fresh Part 1 factory is needed, and
    // that path needs his direction. Said plainly, no dead button.
    if (part1Used && !resumeAvailable && step === 'configure') {
        return (
            <div className="tc-empty">
                <p className="tc-empty-title">Step 1 already ran on the shared factory.</p>
                <p className="tc-empty-body">
                    The shared Part 1 factory deploys one launch. It already ran
                    {part1Launched ? ' and the launch completed.' : ', and step 2 is still pending for its owner.'}{' '}
                    A fresh Part 1 factory is needed before the next launch. That step is not
                    built yet. Nothing here will deploy a factory on its own.
                </p>
            </div>
        );
    }

    if (step === 'prove' && launched) {
        const certId = launched.log ? launched.log.certificateId.toString() : null;
        const token = launched.log ? launched.log.token : null;
        return (
            <div>
                <p className="tc-lede">
                    The launch is complete. Step 2 confirmed. The certificate is minted
                    and the launch appears in the list.
                </p>
                <dl className="tc-terms">
                    <div className="tc-term">
                        <dt>Transaction</dt>
                        <dd>
                            <a href={explorerTx(launched.hash)} target="_blank" rel="noreferrer" className="tc-mono">
                                {launched.hash.slice(0, 10)}...{launched.hash.slice(-6)}
                            </a>
                        </dd>
                    </div>
                    {certId && (
                        <div className="tc-term">
                            <dt>Certificate</dt>
                            <dd>
                                <Link href={tcUrl(`/launches/${certId}`)}>
                                    Launch certificate {certId}
                                </Link>
                            </dd>
                        </div>
                    )}
                    {token && (
                        <div className="tc-term">
                            <dt>Token page</dt>
                            <dd>
                                <Link href={tradeUrl(`/token/${token}`)}>Open the token page</Link>
                            </dd>
                        </div>
                    )}
                </dl>
                {!launched.log && (
                    <p className="tc-empty-body">
                        The launch log was not found in the receipt. The transaction
                        confirmed. Check the explorer link above for the full record.
                    </p>
                )}
            </div>
        );
    }

    if (step === 'lock-part2') {
        const rawToken = part1.data?.token;
        const tokenAddress = rawToken && !isZeroAddress(rawToken) ? rawToken : null;
        return (
            <div>
                <ol className="tc-steps" aria-label="Launch steps">
                    <li className="tc-step"><span className="tc-index">//01</span>Configure</li>
                    <li className="tc-step" aria-current="step"><span className="tc-index">//02</span>Lock</li>
                    <li className="tc-step"><span className="tc-index">//03</span>Prove</li>
                </ol>
                <p className="tc-lede">
                    Step 1 finished. The token, the locker, and the optional vault and
                    distributor are deployed. Nothing is economically live until step 2
                    confirms. Step 2 deploys the TCHook pair, runs the frozen
                    distribution, and mints the certificate.
                </p>
                <dl className="tc-terms">
                    <div className="tc-term">
                        <dt>Part 1 factory</dt>
                        <dd className="tc-mono">{DISTRIBUTION_FACTORY}</dd>
                    </div>
                    <div className="tc-term">
                        <dt>Token</dt>
                        <dd className="tc-mono">{tokenAddress || 'Reading.'}</dd>
                    </div>
                    <div className="tc-term">
                        <dt>Step 1 transaction</dt>
                        <dd>
                            <a href={explorerTx(stored?.deployTx || deployState.hash)} target="_blank" rel="noreferrer" className="tc-mono">
                                Open on Basescan Sepolia
                            </a>
                        </dd>
                    </div>
                    <div className="tc-term">
                        <dt>Quote side</dt>
                        <dd>
                            {tokenAddress && quote
                                ? quote.address.toLowerCase() < tokenAddress.toLowerCase()
                                    ? `${quote.symbol} is currency0`
                                    : `${quote.symbol} is currency1`
                                : 'Set from the token address.'}
                        </dd>
                    </div>
                    <div className="tc-term">
                        <dt>Vesting terms</dt>
                        <dd>
                            {stored && Number(stored.form.vestingPct) > 0
                                ? `Beneficiary ${stored.form.vestingBeneficiary}. Cliff ${stored.form.vestingCliffDays} days, duration ${stored.form.vestingDurationDays} days.`
                                : 'No vesting.'}
                        </dd>
                    </div>
                    <div className="tc-term">
                        <dt>Airdrop Merkle root</dt>
                        <dd className="tc-mono">
                            {stored && Number(stored.form.airdropPct) > 0 ? stored.form.airdropMerkleRoot : 'No airdrop.'}
                        </dd>
                    </div>
                    <div className="tc-term">
                        <dt>Estimated gas, step 2</dt>
                        <dd>
                            {estimate2?.failed
                                ? 'Could not be estimated. The wallet shows the cost before signing.'
                                : estimate2
                                  ? formatEth(estimate2.cost)
                                  : 'Estimating.'}
                        </dd>
                    </div>
                </dl>

                {launchState.status === 'failed' && (
                    <div className="tc-block-gap-top">
                        <ErrorFix
                            title="Step 2 did not go through."
                            fix={launchState.message || 'Check the message and try again. Step 1 stays deployed and resumable.'}
                        />
                    </div>
                )}
                {launchState.status === 'unknown' && (
                    <div className="tc-block-gap-top">
                        <ErrorFix
                            title="No receipt arrived within two minutes."
                            fix="The transaction may still confirm. Check the explorer link, then come back. Step 1 stays deployed and resumable."
                        />
                    </div>
                )}

                <div className="tc-block-gap-top">
                    {!wallet.address ? (
                        <button type="button" className="tc-button-primary" onClick={wallet.connect} disabled={wallet.connecting}>
                            Connect a wallet
                        </button>
                    ) : !wallet.isCorrectNetwork ? (
                        <button type="button" className="tc-button-primary" onClick={wallet.switchNetwork}>
                            Switch to {CHAIN_NAME}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="tc-button-primary"
                            onClick={sendLaunch}
                            disabled={launchState.status === 'sending' || launchState.status === 'confirming'}
                        >
                            {launchState.status === 'sending'
                                ? 'Waiting for the wallet.'
                                : launchState.status === 'confirming'
                                  ? 'Waiting for confirmation.'
                                  : 'Launch token, step 2'}
                        </button>
                    )}
                </div>
                {wallet.error && (
                    <p className="tc-field-error">{wallet.error.message}</p>
                )}
            </div>
        );
    }

    if (step === 'lock') {
        return (
            <div>
                <ol className="tc-steps" aria-label="Launch steps">
                    <li className="tc-step"><span className="tc-index">//01</span>Configure</li>
                    <li className="tc-step" aria-current="step"><span className="tc-index">//02</span>Lock</li>
                    <li className="tc-step"><span className="tc-index">//03</span>Prove</li>
                </ol>
                <p className="tc-lede">
                    Review your configured parameters below. Once committed to Base,
                    these fee structures, liquidity gates, and lock schedules cannot
                    be modified by any address. A launch is two transactions: Part 1
                    deploys, Part 2 launches. The launch is not complete until Part 2
                    confirms.
                </p>

                <div className="tc-review">
                    <dl className="tc-terms">
                        <div className="tc-term"><dt>Name</dt><dd>{form.name.trim()}</dd></div>
                        <div className="tc-term"><dt>Symbol</dt><dd>{form.symbol.trim()}</dd></div>
                        <div className="tc-term"><dt>Total supply</dt><dd>{form.totalSupply}</dd></div>
                        <div className="tc-term"><dt>Creator</dt><dd className="tc-mono">{form.creator.trim()}</dd></div>
                        <div className="tc-term"><dt>Quote asset</dt><dd>{quote ? `${quote.name} (${quote.symbol})` : 'None'}</dd></div>
                        <div className="tc-term"><dt>Pool fee tier</dt><dd>{(Number(form.poolFeeTier) / 10000).toFixed(2)}%</dd></div>
                        <div className="tc-term"><dt>Gate threshold</dt><dd>{form.volumeThresholdQuote} {quote?.symbol}</dd></div>
                        <div className="tc-term"><dt>USD anchor</dt><dd>{formatUsdGate(USD_GATE_UNITS)}</dd></div>
                        <div className="tc-term"><dt>Quote price used</dt><dd>{form.quoteUsdPrice ? `$${form.quoteUsdPrice} per ${quote?.symbol}` : 'Entered directly, no price used'}</dd></div>
                        <div className="tc-term"><dt>Lock</dt><dd>{Number(form.lockMode) === 0 ? 'Abyssal, forever' : `Timed, ${form.lockDurationDays} days`}</dd></div>
                        <div className="tc-term"><dt>LP fees</dt><dd>{Number(form.lpFeeMode) === 0 ? 'Creator claimable' : 'Dead, compounded'}</dd></div>
                        <div className="tc-term"><dt>Split</dt><dd>{form.vestingPct}% vesting, {form.airdropPct}% airdrop, {form.liquidityPct}% liquidity</dd></div>
                        <div className="tc-term"><dt>Vesting terms</dt><dd>{Number(form.vestingPct) > 0 ? `Beneficiary ${form.vestingBeneficiary.trim()}. Cliff ${form.vestingCliffDays} days, duration ${form.vestingDurationDays} days.` : 'No vesting.'}</dd></div>
                        <div className="tc-term"><dt>Airdrop Merkle root</dt><dd className="tc-mono">{Number(form.airdropPct) > 0 ? form.airdropMerkleRoot.trim() : 'No airdrop.'}</dd></div>
                        <div className="tc-term"><dt>Liquidity goes to</dt><dd className="tc-mono">{form.liquidityAllocation.trim()}</dd></div>
                        <div className="tc-term"><dt>Wallet cap</dt><dd>{Number(form.walletCapTokens) === 0 ? 'Off' : `${form.walletCapTokens} tokens for ${form.walletCapBlocks} blocks`}</dd></div>
                        <div className="tc-term"><dt>Max swap guard</dt><dd>{Number(form.maxSwapQuote) === 0 ? 'Off' : `${form.maxSwapQuote} ${quote?.symbol} for ${form.maxSwapBlocks} blocks`}</dd></div>
                        <div className="tc-term"><dt>Quote side</dt><dd>Set after step 1, from the token address.</dd></div>
                        <div className="tc-term"><dt>Transactions</dt><dd>2. Step 1 deploys. Step 2 launches.</dd></div>
                        <div className="tc-term"><dt>Step 1 value</dt><dd>{airdropOn ? formatEth(deployValue) : '0 ETH'}</dd></div>
                        <div className="tc-term"><dt>Estimated gas, step 1</dt><dd>{estimate ? formatEth(estimate.cost) : 'Estimating.'}</dd></div>
                        <div className="tc-term"><dt>Estimated gas, step 2</dt><dd>Estimated after step 1, on the step 2 screen. No token exists yet to estimate against.</dd></div>
                    </dl>
                </div>

                <p className="tc-lede">
                    Fee rule: 0% before the pool crosses {formatUsdGate(USD_GATE_UNITS)} in
                    cumulative volume, 0.3% after, taken only in the quote asset. The
                    crossing swap pays no fee. The fee never touches the launched token.
                </p>

                {dryRun?.status === 'failed' && (
                    <div className="tc-block-gap-top">
                        <ErrorFix
                            title="The dry run failed."
                            fix={`${dryRun.message} Fix the form and try again. Nothing was sent.`}
                            onRetry={runDeployDryRun}
                            retryLabel="Run the dry run again"
                        />
                    </div>
                )}
                {dryRun?.status === 'passed' && (
                    <p className="tc-field-help">Dry run passed. The params would deploy.</p>
                )}

                {deployState.status === 'failed' && (
                    <div className="tc-block-gap-top">
                        <ErrorFix
                            title="Step 1 did not go through."
                            fix={deployState.message || 'Check the message and try again. Nothing was deployed.'}
                        />
                    </div>
                )}

                <div className="tc-field tc-block-gap-top">
                    <label htmlFor="tc-typed-confirm">
                        Type the symbol ({form.symbol.trim()}) to confirm the launch.
                    </label>
                    <input
                        id="tc-typed-confirm"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        autoComplete="off"
                        placeholder={form.symbol.trim()}
                    />
                    <p className="tc-field-help">
                        Typed confirmation applies to launches. It names exactly what
                        will be created, and it cannot be undone.
                    </p>
                </div>

                <div>
                    {!wallet.address ? (
                        <button type="button" className="tc-button-primary" onClick={wallet.connect} disabled={wallet.connecting}>
                            Connect a wallet
                        </button>
                    ) : !wallet.isCorrectNetwork ? (
                        <button type="button" className="tc-button-primary" onClick={wallet.switchNetwork}>
                            Switch to {CHAIN_NAME}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="tc-button-primary"
                            onClick={sendDeploy}
                            disabled={
                                typed.trim() !== form.symbol.trim() ||
                                deployState.status === 'sending' ||
                                deployState.status === 'confirming'
                            }
                        >
                            {deployState.status === 'sending'
                                ? 'Waiting for the wallet.'
                                : deployState.status === 'confirming'
                                  ? 'Waiting for confirmation.'
                                  : 'Launch token'}
                        </button>
                    )}{' '}
                    <button type="button" className="tc-button-quiet" onClick={() => setStep('configure')}>
                        Back to Configure
                    </button>
                </div>
                {wallet.error && <p className="tc-field-error">{wallet.error.message}</p>}
                <p className="tc-field-help">
                    Signing wallet: {wallet.address || 'none connected'}. The terminal
                    never takes custody and never executes server-side.
                </p>
            </div>
        );
    }

    return (
        <div>
            <ol className="tc-steps" aria-label="Launch steps">
                <li className="tc-step" aria-current="step">Configure</li>
                <li className="tc-step">Lock</li>
                <li className="tc-step">Prove</li>
            </ol>

            {resumeAvailable && (
                <div className="tc-banner tc-block-gap-top" role="note">
                    <span className="tc-banner-label">Resume</span>
                    <span>
                        Step 1 finished and step 2 is still pending. Nothing is
                        economically live until step 2 confirms.
                    </span>
                    <button type="button" className="tc-banner-action" onClick={resume}>
                        Resume step 2
                    </button>
                </div>
            )}

            <form
                className="tc-form tc-block-gap-top"
                onSubmit={(e) => {
                    e.preventDefault();
                    goReview();
                }}
            >
                <div className="tc-field-row-2">
                    <Field label="Name" help="The token name, shown everywhere." error={errors.name}>
                        <input value={form.name} onChange={set('name')} placeholder="Example Token" autoComplete="off" />
                    </Field>
                    <Field label="Symbol" help="Short ticker, shown in caps." error={errors.symbol}>
                        <input value={form.symbol} onChange={set('symbol')} placeholder="EXM" autoComplete="off" />
                    </Field>
                </div>

                <Field label="Total supply" help="Whole tokens. Fixed at launch. 18 decimals." error={errors.totalSupply}>
                    <input value={form.totalSupply} onChange={set('totalSupply')} inputMode="decimal" autoComplete="off" />
                </Field>

                <Field label="Creator" help="Receives claimable LP fees. Defaults to your wallet." error={errors.creator}>
                    <input value={form.creator} onChange={set('creator')} placeholder="0x..." autoComplete="off" className="tc-mono" />
                </Field>

                <Field label="Quote asset" help="The asset the pool quotes in. WETH and USDC are the verified Base Sepolia contracts." error={errors.quoteChoice || quoteError}>
                    <select value={form.quoteChoice} onChange={set('quoteChoice')}>
                        {QUOTE_ASSETS.map((q) => (
                            <option key={q.address} value={q.address}>
                                {q.name} ({q.symbol})
                            </option>
                        ))}
                        <option value="other">Other token address</option>
                    </select>
                </Field>
                {form.quoteChoice === 'other' && (
                    <Field label="Quote asset address" help="Read live from the chain: name, symbol, decimals." error={quoteError}>
                        <input value={form.quoteCustom} onChange={set('quoteCustom')} placeholder="0x..." autoComplete="off" className="tc-mono" />
                    </Field>
                )}
                {quote && form.quoteChoice === 'other' && (
                    <p className="tc-field-help">
                        {quote.name} ({quote.symbol}), {quote.decimals} decimals.
                    </p>
                )}

                <div className="tc-field-row-2">
                    <Field label="Pool fee tier" help={`Tick spacing ${tier?.tickSpacing ?? 'unknown'}. The tier is fixed at launch.`}>
                        <select value={form.poolFeeTier} onChange={set('poolFeeTier')}>
                            {FEE_TIERS.map((t) => (
                                <option key={t.fee} value={t.fee}>
                                    {t.fee / 10000}% (tier {t.fee})
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Quote price in USD" help="No price feed is wired. Enter the quote price from your own source. The inputs print on the certificate.">
                        <input value={form.quoteUsdPrice} onChange={set('quoteUsdPrice')} inputMode="decimal" placeholder={quote?.symbol === 'USDC' ? '1' : '3000'} autoComplete="off" />
                    </Field>
                </div>

                <Field label="Gate threshold, in quote units" help={`The $10M gate, converted once at launch. ${quote ? `1 ${quote.symbol} unit is 10 to the ${quote.decimals}.` : ''} Editable. The conversion inputs print on the certificate.`} error={errors.volumeThresholdQuote}>
                    <input value={form.volumeThresholdQuote} onChange={set('volumeThresholdQuote')} inputMode="decimal" autoComplete="off" />
                </Field>

                <Field label="Lock mode" help="Abyssal locks forever, with no withdrawal function. Timed locks need at least 180 days.">
                    <select value={form.lockMode} onChange={set('lockMode')}>
                        <option value={0}>Abyssal, forever</option>
                        <option value={1}>Timed</option>
                    </select>
                </Field>
                {Number(form.lockMode) === 1 && (
                    <Field label="Lock duration, days" help="At least 180 days. Enforced on chain." error={errors.lockDurationDays}>
                        <input value={form.lockDurationDays} onChange={set('lockDurationDays')} inputMode="numeric" autoComplete="off" />
                    </Field>
                )}

                <Field label="LP fee mode" help="Who can claim the pool fees the locker collects.">
                    <select value={form.lpFeeMode} onChange={set('lpFeeMode')}>
                        <option value={0}>Creator claimable</option>
                        <option value={1}>Dead, compounded</option>
                    </select>
                </Field>

                <div className="tc-field-row">
                    <Field label="Vesting %" error={null}>
                        <input value={form.vestingPct} onChange={set('vestingPct')} inputMode="numeric" autoComplete="off" />
                    </Field>
                    <Field label="Airdrop %" error={null}>
                        <input value={form.airdropPct} onChange={set('airdropPct')} inputMode="numeric" autoComplete="off" />
                    </Field>
                    <Field label="Liquidity %" error={null}>
                        <input value={form.liquidityPct} onChange={set('liquidityPct')} inputMode="numeric" autoComplete="off" />
                    </Field>
                </div>
                <p className={errors.split ? 'tc-field-error' : 'tc-field-help'}>
                    Splits add to {splitSum}%. They must add to exactly 100%.
                    {errors.split ? ` ${errors.split}` : ''}
                </p>

                {Number(form.vestingPct) > 0 && (
                    <>
                        <Field label="Vesting beneficiary" help="Receives the vested tokens." error={errors.vestingBeneficiary}>
                            <input value={form.vestingBeneficiary} onChange={set('vestingBeneficiary')} placeholder="0x..." autoComplete="off" className="tc-mono" />
                        </Field>
                        <div className="tc-field-row-2">
                            <Field label="Vesting cliff, days" error={errors.vestingCliffDays}>
                                <input value={form.vestingCliffDays} onChange={set('vestingCliffDays')} inputMode="numeric" autoComplete="off" />
                            </Field>
                            <Field label="Vesting duration, days" error={errors.vestingDurationDays}>
                                <input value={form.vestingDurationDays} onChange={set('vestingDurationDays')} inputMode="numeric" autoComplete="off" />
                            </Field>
                        </div>
                    </>
                )}

                {Number(form.airdropPct) > 0 && (
                    <Field label="Airdrop Merkle root" help="Frozen at launch. Build the tree with your own tooling. Step 1 carries the 0.0194 ETH campaign fee." error={errors.airdropMerkleRoot}>
                        <input value={form.airdropMerkleRoot} onChange={set('airdropMerkleRoot')} placeholder="0x..." autoComplete="off" className="tc-mono" />
                    </Field>
                )}

                <Field label="Liquidity allocation" help="Receives the liquidity tranche. Defaults to your wallet. In production this is the pool initializer." error={errors.liquidityAllocation}>
                    <input value={form.liquidityAllocation} onChange={set('liquidityAllocation')} placeholder="0x..." autoComplete="off" className="tc-mono" />
                </Field>

                <div className="tc-field-row-2">
                    <Field label="Wallet cap, tokens" help="Max balance per wallet during the guard window. Zero turns the cap off." error={errors.walletCapTokens}>
                        <input value={form.walletCapTokens} onChange={set('walletCapTokens')} inputMode="decimal" autoComplete="off" />
                    </Field>
                    <Field label="Wallet cap window, blocks" error={errors.walletCapBlocks}>
                        <input value={form.walletCapBlocks} onChange={set('walletCapBlocks')} inputMode="numeric" autoComplete="off" />
                    </Field>
                </div>

                <div className="tc-field-row-2">
                    <Field label="Max swap size, quote units" help="Max quote-side size per swap during the guard window. Zero turns the guard off." error={errors.maxSwapQuote}>
                        <input value={form.maxSwapQuote} onChange={set('maxSwapQuote')} inputMode="decimal" autoComplete="off" />
                    </Field>
                    <Field label="Max swap window, blocks" error={errors.maxSwapBlocks}>
                        <input value={form.maxSwapBlocks} onChange={set('maxSwapBlocks')} inputMode="numeric" autoComplete="off" />
                    </Field>
                </div>

                <button type="submit" className="tc-button-primary">
                    Review the launch
                </button>
            </form>
        </div>
    );
}
