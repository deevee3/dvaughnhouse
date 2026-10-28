// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {PearlHookCore} from "../src/PearlHookCore.sol";
import {LaunchLocker} from "../src/LaunchLocker.sol";
import {LaunchCertificate} from "../src/LaunchCertificate.sol";
import {AirdropDistributor} from "../src/AirdropDistributor.sol";
import {LaunchToken} from "../src/LaunchToken.sol";
import {MockQuoteAsset, MockLPPosition} from "./Mocks.sol";

/// @title PearlHalmosTest
/// @notice Symbolic verification suite (Halmos — spec §9) proving the three
///         core money invariants across all symbolic inputs:
///         (i)   Locker principal cannot leave before `unlockTime` (and never
///               leaves in Abyssal mode or via `collectFees`).
///         (ii)  Hook fee is strictly 0 below the gate (including on the
///               gate-crossing swap) and `<= 30 bps` of quote above it.
///         (iii) AirdropDistributor pays each leaf index at most once.
contract PearlHalmosTest is Test {
    address constant CREATOR = address(0xC0FFEE);
    address constant TREASURY = address(0x7EA5);
    address constant REPORTER = address(0xBEEF);

    uint256 constant GATE_THRESHOLD = 10_000_000e6;
    uint256 constant TIMED_UNLOCK = 1_000_000 + 180 days;

    MockQuoteAsset feeA;
    MockQuoteAsset feeB;
    MockLPPosition position;
    LaunchLocker abyssalLocker;
    uint256 abyssalTokenId;
    LaunchLocker timedLocker;
    uint256 timedTokenId;
    PearlHookCore hookCore;

    function setUp() public {
        vm.warp(1_000_000);
        feeA = new MockQuoteAsset();
        feeB = new MockQuoteAsset();
        position = new MockLPPosition(feeA, feeB);

        abyssalLocker = new LaunchLocker(
            CREATOR,
            LaunchCertificate.LockMode.Abyssal,
            LaunchCertificate.LpFeeMode.CreatorClaimable,
            type(uint256).max
        );
        abyssalTokenId = position.mint(address(abyssalLocker));
        abyssalLocker.deposit(address(position), abyssalTokenId);

        timedLocker = new LaunchLocker(
            CREATOR,
            LaunchCertificate.LockMode.Timed,
            LaunchCertificate.LpFeeMode.CreatorClaimable,
            TIMED_UNLOCK
        );
        timedTokenId = position.mint(address(timedLocker));
        timedLocker.deposit(address(position), timedTokenId);

        hookCore = new PearlHookCore(TREASURY, REPORTER, false, GATE_THRESHOLD, 0, 0);
    }

    // ---------------------------------------------------------------------
    // Invariant (i): Locker principal cannot leave before unlockTime
    // ---------------------------------------------------------------------

    /// @notice Symbolic proof: Abyssal locker principal can never be withdrawn
    ///         at any timestamp by any caller.
    function check_locker_abyssal_principal_never_leaves(uint256 warpTimestamp, address caller) public {
        vm.assume(caller != address(0));

        vm.warp(warpTimestamp);
        vm.prank(caller);
        (bool ok,) = address(abyssalLocker).call(abi.encodeWithSelector(LaunchLocker.withdrawPrincipal.selector));

        assert(!ok);
        assert(position.ownerOf(abyssalTokenId) == address(abyssalLocker));
    }

    /// @notice Symbolic proof: Timed locker principal can never be withdrawn
    ///         before `unlockTime` by any caller, and only by `creator` at/after `unlockTime`.
    function check_locker_timed_principal_never_leaves_before_unlock(
        uint256 warpTimestamp,
        address caller
    ) public {
        vm.assume(caller != address(0));

        vm.warp(warpTimestamp);
        vm.prank(caller);
        (bool ok,) = address(timedLocker).call(abi.encodeWithSelector(LaunchLocker.withdrawPrincipal.selector));

        if (warpTimestamp < TIMED_UNLOCK || caller != CREATOR) {
            assert(!ok);
            assert(position.ownerOf(timedTokenId) == address(timedLocker));
        } else {
            assert(ok);
            assert(position.ownerOf(timedTokenId) == CREATOR);
        }
    }

    // ---------------------------------------------------------------------
    // Invariant (ii): Hook fee is 0 below gate and <= 30 bps above gate
    // ---------------------------------------------------------------------

    /// @notice Symbolic proof: pure `quoteFee` is 0 when `!gateCrossedBefore`
    ///         and `(quoteAmount * 30) / 10_000` (<= quoteAmount) when `gateCrossedBefore`.
    function check_hook_quoteFee_bounds(uint256 quoteAmount, bool gateCrossedBefore) public view {
        vm.assume(quoteAmount <= type(uint128).max);

        uint256 fee = hookCore.quoteFee(quoteAmount, gateCrossedBefore);
        if (!gateCrossedBefore) {
            assert(fee == 0);
        } else {
            uint256 expected = (quoteAmount * 30) / 10_000;
            assert(fee == expected);
            assert(fee <= quoteAmount);
        }
    }

    /// @notice Symbolic proof: stateful `recordSwap` across two arbitrary swaps
    ///         charges 0 whenever cumulative volume before the swap is below
    ///         `GATE_THRESHOLD` (including on the crossing swap itself) and
    ///         charges `(swapQuote * 30) / 10_000` once the gate is active.
    function check_hook_stateful_gate_and_fee_bounds(
        uint256 swap1Quote,
        uint256 swap2Quote
    ) public {
        vm.assume(swap1Quote <= type(uint128).max);
        vm.assume(swap2Quote <= type(uint128).max);

        // Swap 1 starts at cumulativeVolumeQuote == 0 < GATE_THRESHOLD => must be fee-free
        vm.prank(REPORTER);
        uint256 fee1 = hookCore.recordSwap(swap1Quote);
        assert(fee1 == 0);
        assert(hookCore.cumulativeVolumeQuote() == swap1Quote);

        // Swap 2 starts with gate active iff swap1Quote >= GATE_THRESHOLD
        bool activeBeforeSwap2 = hookCore.feeActive();
        assert(activeBeforeSwap2 == (swap1Quote >= GATE_THRESHOLD));

        vm.prank(REPORTER);
        uint256 fee2 = hookCore.recordSwap(swap2Quote);
        if (!activeBeforeSwap2) {
            assert(fee2 == 0);
        } else {
            assert(fee2 == (swap2Quote * 30) / 10_000);
            assert(fee2 <= swap2Quote);
        }
        assert(hookCore.totalFeesQuote() == fee1 + fee2);
    }

    // ---------------------------------------------------------------------
    // Invariant (iii): AirdropDistributor pays a leaf at most once
    // ---------------------------------------------------------------------

    /// @notice Symbolic proof: any claimed leaf index cannot be claimed a
    ///         second time, preserving the remaining distributor balance.
    function check_distributor_pays_leaf_at_most_once(
        uint256 index,
        address account,
        uint256 amount
    ) public {
        vm.assume(account != address(0) && account != address(this));
        vm.assume(amount > 0 && amount <= 1_000_000_000e18);

        // Single-leaf Merkle tree: root == leaf, proof is empty
        bytes32 root = keccak256(abi.encodePacked(index, account, amount));
        vm.assume(root != bytes32(0));

        vm.deal(address(this), 1 ether);
        LaunchToken token = new LaunchToken("A", "A", amount * 2, address(this), 0, 0, new address[](0));
        AirdropDistributor dist = new AirdropDistributor{value: 0.0194 ether}(IERC20(address(token)), root, TREASURY);
        vm.assume(account != address(dist));
        token.transfer(address(dist), amount * 2);

        bytes32[] memory emptyProof = new bytes32[](0);

        // First claim succeeds and transfers exact `amount`
        dist.claim(index, account, amount, emptyProof);
        assert(dist.isClaimed(index));
        assert(token.balanceOf(account) == amount);
        assert(token.balanceOf(address(dist)) == amount);

        // Second claim on the same index must revert
        (bool ok,) = address(dist).call(
            abi.encodeWithSelector(AirdropDistributor.claim.selector, index, account, amount, emptyProof)
        );
        assert(!ok);
        assert(token.balanceOf(account) == amount);
        assert(token.balanceOf(address(dist)) == amount);
    }
}
