// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";

import {AttestationRegistry} from "../src/AttestationRegistry.sol";

/// @title DeployAttestationRegistry
/// @notice Deploys the Pearls AttestationRegistry — the on-chain anchor
///         for Glenride attestations issued by ThinkTank OS ("Witness").
///         The registry is standalone: it does not interact with the
///         LaunchFactory or any other Pearls contract.
///
/// @dev TARGET: Base Sepolia testnet (chain ID 84532) or local Anvil
///      (31337) ONLY. The script REVERTS on any other chain id — including
///      Base mainnet (8453). The registry is an unaudited prototype;
///      mainnet deployment is a separate, gated decision (third-party
///      audit first — see ATTESTATION-ANCHORING.md) and this script will
///      not perform it.
///
///      Environment variables:
///        DEPLOYER_KEY       Private key of the deployer (TESTNET key
///                           only). Supplied at run time by the owner;
///                           never committed to this repo.
///        ATTESTATION_ISSUER Address of the Glenride issuer (the Safe
///                           that will call `anchor`). Immutable in the
///                           registry once deployed — on Sepolia use a
///                           throwaway test Safe/EOA, never the real
///                           issuer, unless the owner decides otherwise.
///
///      Example (dry run first; add --broadcast only on the owner's word):
///        source .env
///        forge script script/DeployAttestationRegistry.s.sol:DeployAttestationRegistry \
///          --rpc-url $BASE_SEPOLIA_RPC_URL
contract DeployAttestationRegistry is Script {
    function run() external {
        require(
            block.chainid == 84532 || block.chainid == 31337,
            "Pearls DeployAttestationRegistry: Base Sepolia (84532) or Anvil (31337) only"
        );
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address issuer = vm.envAddress("ATTESTATION_ISSUER");

        vm.startBroadcast(deployerKey);
        AttestationRegistry registry = new AttestationRegistry(issuer);
        vm.stopBroadcast();

        console.log("AttestationRegistry deployed at:", address(registry));
        console.log("Issuer (immutable):", issuer);
        console.log("Chain ID:", block.chainid);
        console.log("---");
        console.log("NEXT: record this address in ThinkTank OS as the");
        console.log("attestation anchor contract, then anchor a test");
        console.log("attestation from the issuer address to prove the path.");
    }
}
