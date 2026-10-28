// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {AttestationRegistry} from "../src/AttestationRegistry.sol";

/// @notice AttestationRegistry suite: issuer-only hash anchoring for
///         Glenride attestations ("Witness"). Hashes only — no content
///         ever reaches this contract.
contract AttestationRegistryTest is Test {
    AttestationRegistry registry;

    address issuer = makeAddr("issuer"); // the Glenride issuer Safe (test double)
    address stranger = makeAddr("stranger");

    // Literal hashes (sha256 of "thinktank-os subject A" / "... B").
    // NOT sha256(...) expressions: those evaluate as runtime precompile
    // calls, which consume vm.prank / vm.expectRevert cheatcodes.
    bytes32 constant HASH_A = 0x15a5ffa8c0a2c7c3c32b83fbf98b90841a5d929e65ed6e1013cc9ed595259100;
    bytes32 constant HASH_B = 0xb1067a0d1ffbc31c5d36ac4967109023d40008c2e01cfe00124d1d2f2c07bef1;
    string constant ID_A = "GLR-AT-2026-TEST01";
    string constant ID_B = "GLR-AT-2026-TEST02";

    function setUp() public {
        registry = new AttestationRegistry(issuer);
    }

    // ---------------------------------------------------------------------
    // Construction
    // ---------------------------------------------------------------------

    function test_constructor_sets_immutable_issuer() public view {
        assertEq(registry.ISSUER(), issuer);
    }

    function test_constructor_zero_issuer_reverts() public {
        vm.expectRevert(AttestationRegistry.ZeroAddress.selector);
        new AttestationRegistry(address(0));
    }

    // ---------------------------------------------------------------------
    // Anchor — happy path, read-backs, event
    // ---------------------------------------------------------------------

    function test_anchor_happy_path_and_readbacks() public {
        vm.warp(1_700_000_000);
        vm.prank(issuer);
        registry.anchor(HASH_A, ID_A);

        (bytes32 subjectHash, address recordIssuer, uint256 anchoredAt, bool exists) = registry.recordOf(ID_A);
        assertEq(subjectHash, HASH_A);
        assertEq(recordIssuer, issuer);
        assertEq(anchoredAt, 1_700_000_000);
        assertTrue(exists);

        assertTrue(registry.isAnchored(ID_A));
        assertEq(registry.publicIdOf(HASH_A), ID_A);
    }

    function test_anchor_emits_attested_event() public {
        vm.warp(1_700_000_123);
        vm.expectEmit(false, true, true, true, address(registry));
        emit AttestationRegistry.Attested(ID_A, HASH_A, issuer, 1_700_000_123);
        vm.prank(issuer);
        registry.anchor(HASH_A, ID_A);
    }

    function test_unanchored_lookups_are_empty() public view {
        (bytes32 subjectHash, address recordIssuer, uint256 anchoredAt, bool exists) = registry.recordOf(ID_B);
        assertEq(subjectHash, bytes32(0));
        assertEq(recordIssuer, address(0));
        assertEq(anchoredAt, 0);
        assertFalse(exists);

        assertFalse(registry.isAnchored(ID_B));
        assertEq(registry.publicIdOf(HASH_B), "");
    }

    // ---------------------------------------------------------------------
    // Anchor — reverts
    // ---------------------------------------------------------------------

    function test_anchor_non_issuer_reverts() public {
        vm.prank(stranger);
        vm.expectRevert(AttestationRegistry.NotIssuer.selector);
        registry.anchor(HASH_A, ID_A);

        // The failed call anchored nothing.
        assertFalse(registry.isAnchored(ID_A));
    }

    function test_anchor_duplicate_public_id_reverts() public {
        vm.startPrank(issuer);
        registry.anchor(HASH_A, ID_A);
        // Same public ID again — even with a different hash — reverts.
        vm.expectRevert(AttestationRegistry.AlreadyAnchored.selector);
        registry.anchor(HASH_B, ID_A);
        vm.stopPrank();

        // The original record is untouched.
        (bytes32 subjectHash,, uint256 anchoredAt, bool exists) = registry.recordOf(ID_A);
        assertEq(subjectHash, HASH_A);
        assertTrue(anchoredAt > 0);
        assertTrue(exists);
    }

    // ---------------------------------------------------------------------
    // Same subject hash, two public IDs — both anchor; first wins reverse
    // ---------------------------------------------------------------------

    function test_same_hash_two_public_ids_first_wins_reverse_lookup() public {
        vm.startPrank(issuer);
        registry.anchor(HASH_A, ID_A);
        registry.anchor(HASH_A, ID_B);
        vm.stopPrank();

        // Both public IDs carry their own forward record for the same hash.
        (bytes32 hashA,,, bool existsA) = registry.recordOf(ID_A);
        (bytes32 hashB,,, bool existsB) = registry.recordOf(ID_B);
        assertEq(hashA, HASH_A);
        assertEq(hashB, HASH_A);
        assertTrue(existsA);
        assertTrue(existsB);

        // Reverse lookup keeps the FIRST public ID anchored for the hash.
        assertEq(registry.publicIdOf(HASH_A), ID_A);
    }
}
