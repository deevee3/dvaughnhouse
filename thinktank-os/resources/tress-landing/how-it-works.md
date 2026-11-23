# How it works — Tress Column

> Configure, lock, prove. How a Tress Column launch is set once, frozen, and proven by its certificate.

Canonical: https://tc.dvaughnhouse.com/how-it-works
Last updated: 2026-11-20

## How it works

### Configure

The creator sets everything in one launch() transaction: total supply, the distribution split, vesting terms, lock mode, and launch guards. The split must add up exactly — vesting + airdrop + liquidity = 100% — checked on-chain before the launch exists.

### Lock

The factory deploys the token, the pool, and the locker with those terms written into immutable fields. There is no function that writes launch state after construction. No owner. No pause. No upgrade path. If it isn't in the contract at launch, it does not exist.

### Prove

Every launch mints exactly one certificate holding the full record in plain language — supply, splits, lock, vesting, fee mode, gate. Written once, by the factory, in the launch transaction. Nobody has to take anyone's word for any of it.

## Six parts, one job each

No backstage. Every actor in a Tress Column launch is named, and each one's power ends exactly where its job does.

- **Creator (the person):** Configures the launch once, in the open — then cannot change anything. Their discipline is the product.
- **Trader (the person):** Reads the certificate, then trades the pool. The terms they read are the terms the contracts enforce.
- **Factory (the contract):** Deploys everything in the launch transaction and freezes the terms into immutable fields.
- **Hook (the contract):** Guards the launch window and applies the launch's fee rule — nothing below its gate, its configured rate in quote asset above it.
- **Certificate (the record):** The full launch record, written once, kept on-chain, readable by anyone forever.
- **Locker (the contract):** Holds the liquidity. Abyssal locks have no withdrawal function at all; timed locks enforce a 180-day floor.

## Manifesto

Most token launchpads run on fine print and moving goalposts. Fees shift after volume arrives. Locks quietly expire. Liquidity rules get rewritten the moment incentives change.

Tress Column is built on a different premise: if the terms can change after launch, it was never a fair launch.

A column exists to bear weight without bending. Before a single token trades on Base, every parameter on Tress Column is configured in the open, locked into immutable contract logic, and printed in plain language. No hidden admin keys. No discretionary fee switches. No ambiguity between what the landing page promises and what the contract executes.

Configure your parameters. Lock the terms. Prove the state on-chain. When the rules are carved at inception, builders can focus on shipping and participants can verify the ground they stand on.

## Related

- [Tress Column](https://tc.dvaughnhouse.com/)
- [The certificate](https://tc.dvaughnhouse.com/certificate)
